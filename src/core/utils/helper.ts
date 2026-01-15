import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const UUID = process.env.UUID || '5efabea4-f6d4-91fd-b8f0-17e004c89c60';
export const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
export const NEZHA_PORT = process.env.NEZHA_PORT || '';
export const NEZHA_KEY = process.env.NEZHA_KEY || '';
export const DOMAIN = process.env.DOMAIN || '1234.abc.com'; // Adjust default if needed
export const AUTO_ACCESS = process.env.AUTO_ACCESS || 'true';
export const WSPATH = process.env.WSPATH || 'sub';
export const NAME = process.env.NAME || '';
export const PORT = process.env.PORT || 3000;

// Custom DNS Resolver from original script
const DNS_SERVERS = ['8.8.4.4', '1.1.1.1'];

export function resolveHost(host: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(host)) {
            resolve(host);
            return;
        }
        let attempts = 0;

        function tryNextDNS() {
            if (attempts >= DNS_SERVERS.length) {
                reject(new Error(`Failed to resolve ${host} with all DNS servers`));
                return;
            }
            const dnsServer = DNS_SERVERS[attempts];
            attempts++;
            const dnsQuery = `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`;

            axios.get(dnsQuery, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/dns-json'
                }
            })
                .then(response => {
                    const data = response.data;
                    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
                        const ip = (data.Answer as any[]).find(record => record.type === 1);
                        if (ip) {
                            resolve(ip.data);
                            return;
                        }
                    }
                    tryNextDNS();
                })
                .catch(() => {
                    tryNextDNS();
                });
        }

        tryNextDNS();
    });
}
