import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import * as crypto from 'crypto';

export interface Response<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || crypto.randomBytes(8).toString('hex');

    return next.handle().pipe(
      map(data => {
        // If data is already a formatted response or stream, return as is
        if (data && data._isStream) {
          return data;
        }
        return {
          success: true,
          data,
          requestId,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}
