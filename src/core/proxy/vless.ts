import { WebSocket, createWebSocketStream } from 'ws';
import net from 'net';
import { resolveHost, UUID } from '../utils/helper';

const uuid = UUID.replace(/-/g, "");

export function handleVlessConnection(ws: WebSocket, msg: Buffer): boolean {
    const [VERSION] = msg;
    const id = msg.subarray(1, 17);

    // Validate UUID
    const isValidId = id.every((v, i) => v === parseInt(uuid.substr(i * 2, 2), 16));
    if (!isValidId) return false;

    let i = msg.subarray(17, 18).readUInt8() + 19;
    const port = msg.subarray(i, i += 2).readUInt16BE(0);
    const ATYP = msg.subarray(i, i += 1).readUInt8();

    // Parse Host
    let host = '';
    if (ATYP === 1) { // IPv4
        host = msg.subarray(i, i += 4).join('.');
    } else if (ATYP === 2) { // Domain
        const domainLen = msg.subarray(i, i + 1).readUInt8();
        i += 1; // Move past length byte
        host = new TextDecoder().decode(msg.subarray(i, i += domainLen));
    } else if (ATYP === 3) { // IPv6
        host = msg.subarray(i, i += 16).reduce<string[]>((s, b, idx, a) => {
            return idx % 2 ? s.concat(a.subarray(idx - 1, idx + 1).readUInt16BE(0).toString(16)) : s;
        }, []).join(':');
    } else {
        return false;
    }

    ws.send(new Uint8Array([VERSION, 0]));
    const duplex = createWebSocketStream(ws);

    resolveHost(host)
        .then(resolvedIP => {
            const client = net.connect({ host: resolvedIP, port }, function () {
                client.write(msg.subarray(i));
                duplex.on('error', () => { }).pipe(client).on('error', () => { }).pipe(duplex);
            });
            client.on('error', () => { });
        })
        .catch(() => {
            // Fallback to original host if resolution fails
            const client = net.connect({ host, port }, function () {
                client.write(msg.subarray(i));
                duplex.on('error', () => { }).pipe(client).on('error', () => { }).pipe(duplex);
            });
            client.on('error', () => { });
        });

    return true;
}
