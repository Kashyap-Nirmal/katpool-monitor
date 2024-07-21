import { startServer } from './web';
import { startMetricsServer, updateMetrics } from './metrics';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  startServer();
  startMetricsServer();

  setInterval(async () => {
    await updateMetrics();
  }, 10000);
}

main();
