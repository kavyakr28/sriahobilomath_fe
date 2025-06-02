import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private publicUrls = [
        '/check-aadhaar',
        '/register',
        '/registrations'
      ];
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    try {

        if (this.isPublicUrl(request.url) || request.url.includes('/auth/')) {
            return next.handle(request);
          }

      
      // Skip for login and other auth-related requests
      if (request.url.includes('/auth/')) {
        return next.handle(request);
      }

      // Get the auth header from localStorage
      const authHeader = localStorage.getItem('auth');
      
      // If we have auth header, add it to the request
      if (authHeader) {
        const authReq = request.clone({
          setHeaders: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });
        
        // Handle the request and catch any errors
        return next.handle(authReq).pipe(
          catchError((error: HttpErrorResponse) => {
            // If we get a 401, the credentials are invalid
            if (error.status === 401) {
              // Clear the invalid auth data
              this.authService.logout();
              // Redirect to login page
              this.router.navigate(['/login']);
            }
            // Re-throw the error to be handled by the component
            return throwError(() => error);
          })
        );
      }
      
      // If no auth header, redirect to login
      this.authService.logout();
      return next.handle(request);
    } catch (error) {
      console.error('Error in auth interceptor:', error);
      // If something goes wrong, clear auth data and redirect to login
      this.authService.logout();
      return throwError(() => error);
    }
  }

  private isPublicUrl(url: string): boolean {
    return this.publicUrls.some(publicUrl => url.includes(publicUrl));
  }
}
