import { WebSocket, createWebSocketStream } from 'ws';
import net from 'net';
import crypto from 'crypto';
import { resolveHost, UUID } from '../utils/helper';

export function handleTrojanConnection(ws: WebSocket, msg: Buffer): boolean {
    try {
        if (msg.length < 58) return false;

        const receivedPasswordHash = msg.subarray(0, 56).toString();
        // Calculate hash of our UUID
        const hash = crypto.createHash('sha224').update(UUID).digest('hex');

        if (hash !== receivedPasswordHash) return false;

        let offset = 56;
        if (msg[offset] === 0x0d && msg[offset + 1] === 0x0a) {
            offset += 2;
        }

        const cmd = msg[offset];
        if (cmd !== 0x01) return false; // Only support CONNECT for now
        offset += 1;

        const atyp = msg[offset];
        offset += 1;

        let host = '';
        if (atyp === 0x01) { // IPv4
            host = msg.subarray(offset, offset + 4).join('.');
            offset += 4;
        } else if (atyp === 0x03) { // Domain
            const hostLen = msg[offset];
            offset += 1;
            host = msg.subarray(offset, offset + hostLen).toString();
            offset += hostLen;
        } else if (atyp === 0x04) { // IPv6
            host = msg.subarray(offset, offset + 16).reduce<string[]>((s, b, idx, a) => {
                return idx % 2 ? s.concat(a.subarray(idx - 1, idx + 1).readUInt16BE(0).toString(16)) : s;
            }, []).join(':');
            offset += 16;
        } else {
            return false;
        }

        const port = msg.readUInt16BE(offset);
        offset += 2;

        if (offset < msg.length && msg[offset] === 0x0d && msg[offset + 1] === 0x0a) {
            offset += 2;
        }

        const duplex = createWebSocketStream(ws);

        resolveHost(host)
            .then(resolvedIP => {
                const client = net.connect({ host: resolvedIP, port }, function () {
                    if (offset < msg.length) {
                        client.write(msg.subarray(offset));
                    }
                    duplex.on('error', () => { }).pipe(client).on('error', () => { }).pipe(duplex);
                });
                client.on('error', () => { });
            })
            .catch(() => {
                const client = net.connect({ host, port }, function () {
                    if (offset < msg.length) {
                        client.write(msg.subarray(offset));
                    }
                    duplex.on('error', () => { }).pipe(client).on('error', () => { }).pipe(duplex);
                });
                client.on('error', () => { });
            });

        return true;
    } catch (error) {
        return false;
    }
}
