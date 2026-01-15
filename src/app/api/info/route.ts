import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        const res = await axios.get('https://api.ip.sb/geoip');
        const data = res.data;
        const isp = `${data.country_code}-${data.isp}`.replace(/ /g, '_');
        return NextResponse.json({ isp, ip: data.ip });
    } catch (error) {
        return NextResponse.json({ isp: 'Unknown', ip: 'Unknown' }, { status: 500 });
    }
}
