'use client';

import { useState, useEffect } from 'react';

interface DashboardProps {
    isp: string;
    ip: string;
    uuid: string;
    domain: string;
    wspath: string;
}

export default function DashboardClient({ isp, ip, uuid, domain, wspath }: DashboardProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const namePart = `${isp}`;
    const vlessURL = `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=%2F${wspath}#${namePart}`;
    const trojanURL = `trojan://${uuid}@${domain}:443?security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=%2F${wspath}#${namePart}`;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Node Service Dashboard
                    </h1>
                    <p className="mt-2 text-gray-400">Server Status & Configurations</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">System Info</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ISP / Region</span>
                                <span className="font-mono text-green-400">{isp}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">IP Address</span>
                                <span className="font-mono text-blue-400">{ip}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Configuration</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Domain</span>
                                <span className="font-mono">{domain}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">UUID</span>
                                <span className="font-mono text-xs truncate ml-4" title={uuid}>{uuid}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">VLESS Configuration</h3>
                                <p className="text-xs text-gray-500 mt-1">WebSocket + TLS</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(vlessURL, 'vless')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied === 'vless'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {copied === 'vless' ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                            <code className="text-xs text-blue-300 whitespace-nowrap">{vlessURL}</code>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-purple-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Trojan Configuration</h3>
                                <p className="text-xs text-gray-500 mt-1">WebSocket + TLS</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(trojanURL, 'trojan')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied === 'trojan'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                            >
                                {copied === 'trojan' ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                            <code className="text-xs text-purple-300 whitespace-nowrap">{trojanURL}</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
