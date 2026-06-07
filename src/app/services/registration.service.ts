

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map, tap } from 'rxjs';
import { AttendanceData, RegistrationFormData, RegistrationListResponse, RegistrationResponse, AttendanceStatsDTO, ScholarStatsDTO } from '../models/registration-form-data.model';
import { saveAs } from 'file-saver';
import { aadhaarCheck } from '../models/aadhaarCheck';
import { HallOccupancy } from '../models/HallOccupancy';

@Injectable({
  providedIn: 'root'
})


export class RegistrationService {
  private backendUrl = '/api/registrations'; // Your backend API endpoint

  /**
   * Delete a registration by ID
   * @param id The ID of the registration to delete
   * @returns Observable with the delete confirmation message
   */
  deleteRegistration(id: number): Observable<string> {
    console.log("Deleting registration with ID:", id);
    const url = `${this.backendUrl}/delete/${id}`;
    return this.http.delete(url, { responseType: 'text' }).pipe(
      map(response => response as string),
      catchError(this.handleError)
    );
  }

  constructor(private http: HttpClient) { }

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
  checkAadhaar(aadhaar: string): Observable<aadhaarCheck> {
    const url = `${this.backendUrl}/check-aadhaar?aadhaarNumber=${aadhaar}`;
    return this.http.get<aadhaarCheck>(url).pipe(
      map(response => {
        console.log("Response in service", response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  getRegistrations(): Observable<RegistrationFormData[]> {
    const url = `${this.backendUrl}/all`;
    return this.http.get<RegistrationFormData[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all registrations with pagination support
   * @param page Page number (0-indexed, default: 0)
   * @param size Number of items per page (default: 50)
   * @returns Observable of paginated registration response
   */
  getAllRegistrations(page: number = 0, size: number = 50): Observable<RegistrationListResponse> {
    const url = `${this.backendUrl}/all-records?page=${page}&size=${size}`;
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
  getQRImage(id: number): Observable<any> {
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
    totalAmount: number,
    accommodation: string
  }, attendanceLog: AttendanceData, giftGiven: boolean): Observable<void> {
    const url = `${this.backendUrl}/${registrationId}/charges`;

    // Convert numbers to strings to match BigDecimal format
    const payload = {
      travelCharge: charges.travelCharge.toString(),
      sambavanai: charges.sambavanai.toString(),
      totalAmount: charges.totalAmount.toString(),
      accommodation: charges.accommodation.toString(),
      attendanceLog: attendanceLog,
      giftGiven: giftGiven,
    };
    console.log("payload :", payload);

    return this.http.post<void>(url, payload).pipe(
      catchError(this.handleError)
    );
  }

  exportRegistrationsToExcel(): Observable<Blob> {
    return this.http.get(`${this.backendUrl}/export/excel`, { responseType: 'blob' })
      .pipe(
        tap((blob: Blob) => {
          // Use file-saver to trigger the download
          // The filename here will be "registrations_export.csv" as set by the backend
          saveAs(blob, 'registrations.xlsx');
        }),
        catchError(error => {
          console.error('Error downloading the Excel file:', error);
          // Re-throw the error to be handled by the component
          return throwError(() => new Error('Error downloading Excel file.'));
        })
      );
  }


  exportRegistrationsToExcelAll(): Observable<Blob> {
    return this.http.get(`${this.backendUrl}/export/excel/bank-details`, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          saveAs(blob, 'registrations_with_bank_details.xlsx'); // Differentiated filename
        }),
        catchError(error => {
          console.error('Error downloading all records Excel file:', error);
          return throwError(() => new Error('Error downloading all records Excel file.'));
        })
      );
  }

  accommodationStats(): Observable<HallOccupancy> {
    const url = `${this.backendUrl}/halls/occupancy`;
    return this.http.get<HallOccupancy>(url).pipe(
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


  /**
 * Search registrations with pagination and filters
 * @param params Search parameters (page, size, search, id)
 * @returns Observable of paginated registration response
 */
  searchRegistrations(params: {
    page?: number;
    size?: number;
    search?: string;
    id?: string;
  }): Observable<RegistrationListResponse> {
    let url = `${this.backendUrl}/search?page=${params.page || 0}&size=${params.size || 50}`;

    if (params.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }
    if (params.id) {
      url += `&id=${encodeURIComponent(params.id)}`;
    }

    return this.http.get<RegistrationListResponse>(url).pipe(
      catchError(this.handleError)
    );
  }
  /**
   * Get attendance statistics
   * @returns Observable of AttendanceStatsDTO
   */
  getAttendanceStats(): Observable<AttendanceStatsDTO> {
    const url = `${this.backendUrl}/attendance-stats`;
    return this.http.get<AttendanceStatsDTO>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get scholar statistics (Veda and Shaka counts)
   * @returns Observable of ScholarStatsDTO
   */
  getScholarStats(): Observable<ScholarStatsDTO> {
    const url = `${this.backendUrl}/scholar-stats`;
    return this.http.get<ScholarStatsDTO>(url).pipe(
      catchError(this.handleError)
    );
  }
}
