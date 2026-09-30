import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: any = undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as any;
      errorCode = resObj.error || resObj.code || `HTTP_${status}`;
      errorMessage = resObj.message || (exception as Error).message || errorMessage;
      errorDetails = resObj.details || (Array.isArray(resObj.message) ? resObj.message : undefined);
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    const requestId = (request.headers['x-request-id'] as string) || crypto.randomBytes(8).toString('hex');

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails
      },
      requestId,
      timestamp: new Date().toISOString()
    });
  }
}
