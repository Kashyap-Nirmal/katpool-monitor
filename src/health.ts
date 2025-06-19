import { Router } from 'express';
import axios from 'axios';
import logger from './logger/index';

const router = Router();

async function checkService(name: string, checkFn: () => Promise<void>): Promise<[string, string]> {
  try {
    await checkFn();
    return [name, 'ok'];
  } catch {
    return [name, 'fail'];
  }
}

async function fetchAppHealth(name: string, url: string): Promise<[string, any, string]> {
  try {
    const response = await axios.get(url, { timeout: 2000, validateStatus: () => true });
    const status = response.status >= 200 && response.status < 300 ? 'ok' : 'fail';
    return [name, response.data, status];
  } catch (err) {
    return [name, { status: 'fail', error: 'unreachable or invalid response' }, 'fail'];
  }
}

router.get('/health', async (_req, res) => {
  try {
    const results: Record<string, any> = {};
    let overallStatus = 'ok';

    const internalChecks: Array<Promise<[string, string]>> = [
      checkService('victoriametrics', async () => {
        await axios.get('http://katpool-victoria-metrics:8428/health', { timeout: 2000 });
      }),
      checkService('vmagent', async () => {
        const res = await axios.get('http://katpool-vmagent:8429/metrics', { timeout: 2000 });
        if (res.status !== 200 || !res.data.includes('vm_promscrape_targets')) {
          throw new Error('vmagent not healthy');
        }
      }),
    ];

    const externalChecks: Array<Promise<[string, any, string]>> = [
      fetchAppHealth('katpool-app', 'http://katpool-app:9999/health'),
      fetchAppHealth('go-app', 'http://go-app:8080/health'),
    ];

    const internalResults = await Promise.all(internalChecks);
    for (const [name, status] of internalResults) {
      results[name] = status;
      if (status === 'fail') overallStatus = 'fail';
    }

    const externalResults = await Promise.all(externalChecks);
    for (const [name, data, status] of externalResults) {
      results[name] = data;
      if (status === 'fail') overallStatus = 'fail';
    }

    const response = {
      status: overallStatus,
      ...results,
    };

    res.status(overallStatus === 'ok' ? 200 : 503).json(response);
  } catch (err) {
    logger.error('Health check error:', err);
  }
});

export default router;
