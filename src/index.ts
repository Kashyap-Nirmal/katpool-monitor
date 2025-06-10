import { startServer } from './web';
import { configServer } from './config';
import { startMetricsServer, updateMetrics } from './metrics';
import dotenv from 'dotenv';
import logger from './logger';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    promise,
    reason,
  });
  // Optionally exit the process
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  // Optionally exit the process
  process.exit(1);
});

dotenv.config();
logger.info('Main: starting main()');

async function main() {
  try {
    logger.info('Main: starting config server');
    configServer();
    logger.info('Main: starting API server for front-end');
    startServer();
    logger.info('Main: starting Metric Server');
    startMetricsServer();

    logger.info('Main: Setting up interval');
    setInterval(async () => {
      try {
        logger.info('Main: Updating metrics');
        await updateMetrics();
      } catch (error) {
        logger.error('Error updating metrics', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }, 10000);
  } catch (error) {
    logger.error('Fatal error in main', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
