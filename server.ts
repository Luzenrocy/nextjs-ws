import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { handleVlessConnection } from './src/core/proxy/vless';
import { handleTrojanConnection } from './src/core/proxy/trojan';
import { runNezhaAgent } from './src/core/agent/nezha';
import { PORT, WSPATH, UUID, AUTO_ACCESS, DOMAIN } from './src/core/utils/helper';
import axios from 'axios';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url || '');

        // Check if path matches our WS path
        // The original script checks path, but also does protocol detection.
        // We will accept the upgrade on potential paths or root if configured?
        // Original script: path=/${WSPATH}

        if (pathname === `/${WSPATH}`) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                ws.once('message', (msg) => {
                    // Check for VLESS first (original script logic)
                    // VLESS UUID validation is done inside handleVlessConnection, 
                    // but here we might need to peek or just try both.
                    // The original script has logic: checks if msg format looks like VLESS, else tries Trojan.

                    // Helper to check standard VLESS UUID match
                    const uuidStr = UUID.replace(/-/g, "");
                    const msgBuffer = Buffer.from(msg as Buffer); // Ensure buffer

                    if (msgBuffer.length > 17 && msgBuffer[0] === 0) {
                        const id = msgBuffer.subarray(1, 17);
                        const isVless = id.every((v, i) => v === parseInt(uuidStr.substr(i * 2, 2), 16));
                        if (isVless) {
                            if (!handleVlessConnection(ws, msgBuffer)) {
                                ws.close();
                            }
                            return;
                        }
                    }

                    if (!handleTrojanConnection(ws, msgBuffer)) {
                        ws.close();
                    }
                });
            });
        } else {
            // Let Next.js handle upgrade or close? Next.js usually doesn't handle WS upgrades on unknown routes.
            // We can just destroy the socket to be safe.
            socket.destroy();
        }
    });

    server.listen(PORT, (err?: any) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT} with WS Path /${WSPATH}`);

        // Start Nezha Agent
        runNezhaAgent();

        // Auto Access Task
        if (AUTO_ACCESS === 'true' && DOMAIN) {
            const fullURL = `https://${DOMAIN}`;
            const task = async () => {
                try {
                    await axios.post("https://oooo.serv00.net/add-url", { url: fullURL }, { headers: { 'Content-Type': 'application/json' } });
                    console.log('Automatic Access Task added successfully');
                } catch (e) {
                    // ignore
                }
            };
            task();
        }
    });
});
