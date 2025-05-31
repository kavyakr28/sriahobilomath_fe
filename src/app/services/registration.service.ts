import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RegistrationFormData } from '../models/registration-form-data.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private backendUrl = '/api/registrations'; // Your backend API endpoint
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Submit registration form data to the backend
   * @param formData Registration form data
   * @returns Observable of the response
   */
  submitRegistration(formData: RegistrationFormData): Observable<any> {
    const url = `${this.backendUrl}/register`;
    return this.http.post<any>(url, formData, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all registrations
   * @returns Observable of registration array
   */
  /**
   * Check if an Aadhaar number already exists in the system
   * @param aadhaar Aadhaar number to check
   * @returns Observable with boolean indicating if Aadhaar exists
   */
  checkAadhaar(aadhaar: string): Observable<boolean> {
    const url = `${this.backendUrl}/check-aadhaar?aadhaarNumber=${aadhaar}`;
    return this.http.get<boolean>(url, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  getRegistrations(): Observable<RegistrationFormData[]> {
    const url = `${this.backendUrl}/all`;
    return this.http.get<RegistrationFormData[]>(url, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   * @param error Error object
   * @returns Observable with error message
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'An error occurred'));
  }
}
