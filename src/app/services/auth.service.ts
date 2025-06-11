import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
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

export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_USER = 'ROLE_USER';

export interface LoginResponse extends AuthResponse {
  role: any;
  user: User;
}
export interface SignupResponse extends AuthResponse {}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api'; // Update with your API URL
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize with user from localStorage if available
    try {
      const user = localStorage.getItem('user');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      } else {
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.currentUserSubject.next(null);
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthHeader(): string | null {
    return localStorage.getItem('auth');
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  login(username: string, password: string): Observable<LoginResponse> {
    console.log("Logging in to:", this.apiUrl);
    // Encode credentials for Basic Auth
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    
    return this.http.post<LoginResponse & { user: User }>(
      `${this.apiUrl}/auth/login`, 
      {},
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      tap(response => {
        // Store the encoded credentials for future requests
        localStorage.setItem('auth', authHeader);
        // Create user data without duplicating the username
        const { username: _, ...userWithoutUsername } = response.user || {};
        console.log("response : ",response);
        const userData = {
          username,
          roles: response.role,
          // Don't store password, we'll use the auth header
          ...userWithoutUsername
        };
        localStorage.setItem('user', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  signup(userData: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response: SignupResponse) => {
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

  logout() {
    // Remove auth data from local storage
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth');
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role?.includes(ROLE_ADMIN) || false;
  }
  
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.role?.includes(role) || false;
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
