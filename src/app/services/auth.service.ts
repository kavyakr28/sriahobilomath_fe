import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupRequest {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse extends AuthResponse {}
export interface SignupResponse extends AuthResponse {}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api'; // Update with your API URL

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // In AuthService
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  login(username: string, password: string): Observable<LoginResponse> {
    console.log("url",this.apiUrl);
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          // Store the token in local storage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
      );
  }

  signup(userData: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response: SignupResponse) => {
          console.log("response",response);
          // Store the token and user data in local storage
          localStorage.setItem('token', response.token);
          this.router.navigate(['/login']);
        }),
        catchError((error: HttpErrorResponse) => {
          // Handle specific error cases
          let errorMessage = 'An error occurred during signup. Please try again.';
          
          if (error.status === 409) {
            // Duplicate email error
            errorMessage = 'An account with this email already exists';
          } else if (error.status === 400 && error.error?.message) {
            // Validation errors from the server
            console.log("error",error);
            errorMessage = error.error.message;
          }
          
          // Re-throw the error to be handled by the component
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  logout(): void {
    // Remove user data from storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    this.navigateToLogin();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
