import { Request, Response, NextFunction } from 'express';
import rTracer from 'cls-rtracer';

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId: string = String(req.headers['x-trace-id']);
  if (traceId && traceId !== 'undefined') {
    rTracer.runWithId(() => {
      next();
    }, traceId);
  } else {
    next();
  }
};

export default requestContextMiddleware;
