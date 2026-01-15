import { NextResponse } from 'next/server';
import { UUID, DOMAIN, WSPATH, NAME } from '@/core/utils/helper';
import axios from 'axios';

async function getIsp() {
    try {
        const res = await axios.get('https://api.ip.sb/geoip', { timeout: 3000 });
        const data = res.data;
        return `${data.country_code}-${data.isp}`.replace(/ /g, '_');
    } catch (e) {
        return 'Unknown';
    }
}

export async function GET() {
    const isp = await getIsp();
    const namePart = NAME ? `${NAME}-${isp}` : isp;

    // Note: User changed WSPATH to 'sub' in one edit, but usually WSPATH is for WS connection.
    // The original script used: 
    // const vlessURL = `vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F${WSPATH}#${namePart}`;
    // We will follow the same logic.

    const vlessURL = `vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F${WSPATH}#${namePart}`;
    const trojanURL = `trojan://${UUID}@${DOMAIN}:443?security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F${WSPATH}#${namePart}`;

    const subscription = vlessURL + '\n' + trojanURL;
    const base64Content = Buffer.from(subscription).toString('base64');

    return new NextResponse(base64Content + '\n', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
