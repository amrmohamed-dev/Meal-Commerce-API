import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { extractErrorMessage } from '../utils/http-error.util';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = extractErrorMessage(error);
        const requestPath = req.url;
        const isAuthPage = this.router.url.startsWith('/auth');
        const isLoginAction = requestPath.includes('/api/v1/auth/login');

        if (error.status === 401 && !isLoginAction) {
          this.authService.clearSession();
          if (!isAuthPage) {
            this.router.navigate(['/auth/login']);
          }
        }

        if (error.status === 403 && message.toLowerCase().includes('verify')) {
          this.router.navigate(['/auth/verify-email']);
          this.notificationService.warning(message);
          return throwError(() => error);
        }

        this.notificationService.error(message);
        return throwError(() => error);
      }),
    );
  }
}
