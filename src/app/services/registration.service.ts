import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AttendanceData, RegistrationFormData, RegistrationListResponse } from '../models/registration-form-data.model';




@Injectable({
  providedIn: 'root'
})


export class RegistrationService {
  private backendUrl = '/api/registrations'; // Your backend API endpoint

  constructor(private http: HttpClient) {}

  /**
   * Submit registration form data to the backend
   * @param formData Registration form data
   * @returns Observable of the response
   */
  submitRegistration(formData: RegistrationFormData): Observable<any> {
    const url = `${this.backendUrl}/register`;
    return this.http.post<any>(url, formData).pipe(
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
    return this.http.get<{ exists: boolean }>(url).pipe(
      map(response => response.exists),
      catchError(this.handleError)
    );
  }

  getRegistrations(): Observable<RegistrationFormData[]> {
    const url = `${this.backendUrl}/all`;
    return this.http.get<RegistrationFormData[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getAllRegistrations(): Observable<RegistrationListResponse> {
    const url = `${this.backendUrl}/all-records`;
    return this.http.get<RegistrationListResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  getRegistrationCount(): Observable<number> {
    const url = `${this.backendUrl}/count`;
    return this.http.get<number>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Process a scan with the given ID and type
   * @param id The ID of the scan to process
   * @param type The type of scan (e.g., 'attendance' or 'gifts')
   * @returns Observable with the server response
   */
  processScan(id: number, type: string): Observable<any> {
    const url = `${this.backendUrl}/scan/${id}/${type}`;
    return this.http.post(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * QR Image Generation Call
   * @param id Registration ID
   * @returns Observable with the QR image
   */
  getQRImage(id:number): Observable<any> {
    const url = `${this.backendUrl}/${id}/qr-code`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * get list of IDs
   */
  getAllIds(startDate: string, endDate: string): Observable<any> {
    const url = `${this.backendUrl}/attendance-between-dates?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update travel charges, sambavanai, and total amount for a registration
   * @param registrationId The ID of the registration to update
   * @param charges Object containing travelCharge, sambavanai, and totalAmount
   * @returns Observable that completes when the update is successful
   */
  updateCharges(registrationId: number, charges: {
    travelCharge: number,
    sambavanai: number,
    totalAmount: number
  }, attendanceLog: AttendanceData[]): Observable<void> {
    const url = `${this.backendUrl}/${registrationId}/charges`;
    
    // Convert numbers to strings to match BigDecimal format
    const payload = {
      travelCharge: charges.travelCharge.toString(),
      sambavanai: charges.sambavanai.toString(),
      totalAmount: charges.totalAmount.toString(),
      attendanceLog: attendanceLog
    };

    return this.http.post<void>(url, payload).pipe(
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
