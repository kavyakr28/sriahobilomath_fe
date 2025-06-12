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
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Define specific public API paths. These should be the full paths from the server root.
  // Example: if your registration service calls '/api/registrations/register' and it's public.
  private readonly publicApiPaths = [
    { path: '/api/registrations/check-aadhaar', methods: ['GET'] }, // Assuming GET and URL starts with this
    { path: '/api/registrations/register', methods: ['POST'] }      // Assuming POST and exact match
  ];
  private readonly authServicePathPrefix = '/api/auth/';

  constructor(
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Allow auth service calls and defined public API paths to pass without token
    if (request.url.startsWith(this.authServicePathPrefix) || this.isRequestPublic(request)) {
      return next.handle(request);
    }

    const authHeader = this.authService.getAuthHeader();

    if (authHeader) {
      const authReq = request.clone({
        setHeaders: {
          'Authorization': authHeader,
          // Consider removing 'Content-Type' or making it conditional.
          // HttpClient usually sets it correctly for POST/PUT with a JSON body.
          // For GET requests, it's often not needed.
          'Content-Type': 'application/json'
        }
      });

      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Token is invalid, expired, or user is not authorized
            this.authService.logout(); // AuthService handles navigation to login
          }
          return throwError(() => error); // Re-throw for further handling
        })
      );
    } else {
      // No authHeader found for a protected route
      this.authService.logout();
      // Prevent the original request from proceeding.
      // Return an error observable that signals auth failure.
      return throwError(() => new HttpErrorResponse({
        error: 'Authorization token not found. User logged out.',
        status: 401, // Or 0 if preferred for client-side aborts
        url: request.url
      }));
    }
  }

  private isRequestPublic(request: HttpRequest<unknown>): boolean {
    return this.publicApiPaths.some(pattern =>
      pattern.methods.includes(request.method) &&
      (request.method === 'GET' ? request.url.startsWith(pattern.path) : request.url === pattern.path)
    );
  }
}
