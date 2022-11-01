import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import { Request } from "express"
import { Observable, tap } from "rxjs"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    return next.handle().pipe(
      tap(() => {
        const req = context.getArgByIndex(0) as Request
        console.log(
          `[${req.method}] ${req.url} - ${Date.now() - now}ms from ${req.ip}`
        )
      })
    )
  }
}
