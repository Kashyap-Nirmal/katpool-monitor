import { startServer } from './web';
import { configServer } from './config';
import { startMetricsServer, updateMetrics } from './metrics';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  configServer();
  startServer();
  startMetricsServer();

  setInterval(async () => {
    await updateMetrics();
  }, 10000);
}

main();
