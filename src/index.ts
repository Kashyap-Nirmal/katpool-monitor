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
    traceId: 'system',
  });
  // Optionally exit the process
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    traceId: 'system',
  });
  // Optionally exit the process
  process.exit(1);
});

dotenv.config();
logger.info('Main: starting main()');

async function main() {
  // Set the initial traceId in the parent context
  try {
    logger.info('DATABASE_URL', { config: process.env.DATABASE_URL });
    logger.info('Main: starting config server', { traceId: 'system' });
    configServer();
    logger.info('Main: starting API server for front-end', { traceId: 'system' });
    startServer();
    logger.info('Main: starting Metric Server', { traceId: 'system' });
    startMetricsServer();
    logger.info('Main: Setting up interval', { traceId: 'system' });
    setInterval(async () => {
      // logger will ignore all logs for updateMetrics
      try {
        logger.info('Main: Updating metrics', { traceId: 'updateMetrics' });
        await updateMetrics();
      } catch (error) {
        logger.error('Error updating metrics', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          traceId: 'updateMetrics',
        });
      }
    }, 10000);
  } catch (error) {
    logger.error('Fatal error in main', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      traceId: 'system',
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    traceId: '',
  });
  process.exit(1);
});
