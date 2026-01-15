import DashboardClient from './dashboard-client';
import axios from 'axios';
import { UUID, DOMAIN, WSPATH } from '@/core/utils/helper';

export const dynamic = 'force-dynamic';

async function getIspInfo() {
    try {
        const res = await axios.get('https://api.ip.sb/geoip', { timeout: 3000 });
        const data = res.data;
        const isp = `${data.country_code}-${data.isp}`.replace(/ /g, '_');
        return { isp, ip: data.ip };
    } catch (e) {
        return { isp: 'Unknown', ip: 'Unknown' };
    }
}

export default async function Home() {
    const { isp, ip } = await getIspInfo();

    return (
        <DashboardClient
            isp={isp}
            ip={ip}
            uuid={UUID}
            domain={DOMAIN}
            wspath={WSPATH}
        />
    );
}
