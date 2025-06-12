import dotenv from 'dotenv';
import rTracer from 'cls-rtracer';

dotenv.config();

const { DATADOG_SECRET, DATADOG_LOG_URL } = process.env;

interface LogContext {
  [key: string]: any;
  traceId?: string;
}

const baseLogObject = {
  ddsource: 'nodejs',
  service: process.env.DATADOG_SERVICE_NAME || 'prod-katpool-monitor',
  timestamp: new Date().toISOString(),
};

const sendLog = async (level: string, message: string, context: LogContext = {}) => {
  console.log(level, message, context);

  const traceId: string = String(context.traceId || rTracer.id());

  if (traceId === 'updateMetrics') {
    console.log('Ignoring updateMetrics log');
    return;
  }

  const payload = {
    ...baseLogObject,
    ...context,
    traceId,
    level,
    message,
  };

  try {
    const response = await fetch(DATADOG_LOG_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_SECRET!,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Datadog log failed with status ${response.status}`);
    } else {
      console.log('Log sent to Datadog successfully');
    }
  } catch (error) {
    console.error(`Failed to send log to Datadog |`, error);

    // Optional: Send fallback log (if safe to do so)
    try {
      await fetch(DATADOG_LOG_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': DATADOG_SECRET!,
        },
        body: JSON.stringify({
          ...baseLogObject,
          level: 'error',
          message: `Failed to send log to Datadog | ${error}`,
          error: error instanceof Error ? error.stack : error,
          traceId,
        }),
      });
    } catch (fallbackError) {
      console.error('Also failed to send fallback log to Datadog', fallbackError);
    }
  }
};

const logger = {
  info: (message: string, context?: LogContext) => sendLog('info', message, context),
  error: (message: string, context?: LogContext) => sendLog('error', message, context),
  warn: (message: string, context?: LogContext) => sendLog('warn', message, context),
};

export default logger;
