import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Adjust path if necessary

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = this.authService.getAuthHeader(); // Uses your existing method

    // Clone the request to add the new header.
    // Only add the header if authToken exists and the request is to your API.
    if (authToken && request.url.startsWith('/api')) { // Adjust '/api' if your API base URL is different
      const authReq = request.clone({
        headers: request.headers.set('Authorization', authToken)
      });
      return next.handle(authReq);
    }

    // Pass on the cloned request without modification for other requests.
    return next.handle(request);
  }
}
