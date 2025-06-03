import { Request, Response, NextFunction } from 'express';
import { createNamespace } from 'cls-hooked';
import { v4 as uuidv4 } from 'uuid';

// Create a namespace for our request context
export const requestContext = createNamespace('request-context');

// Middleware to set up request context
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  requestContext.run(() => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    requestContext.set('requestId', requestId);
    next();
  });
};

// Helper function to get request ID from context
export const getRequestId = (): string | undefined => {
  return requestContext.get('requestId');
};
