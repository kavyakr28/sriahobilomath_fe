import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegistrationService } from '../../services/registration.service';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  // Scanner properties
  allowedFormats = [BarcodeFormat.QR_CODE];
  currentScanType: 'attendance' | 'gifts' | null = null;
  
  // Camera and device management
  devices$ = new BehaviorSubject<MediaDeviceInfo[]>([]);
  selectedDevice$: Observable<MediaDeviceInfo> = this.devices$.pipe(
    map((device) => device[0]),
    distinctUntilChanged(),
    shareReplay(1)
  );
  enable$ = this.devices$.pipe(map(Boolean));
  
  // Camera control
  isCameraActive = false;
  
  toggleCamera(enable: boolean): void {
    this.isCameraActive = enable;
    if (enable) {
      // Small timeout to ensure the view is updated before initializing the scanner
      setTimeout(() => {
        if (this.scanner) {
          this.scanner.ngOnInit();
        }
      });
    }
  }
  
  // Scan results
  scanSuccess$ = new BehaviorSubject<string>('');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private registrationService: RegistrationService
  ) {}

  ngOnInit(): void {}

  scanError(error: Error) {
    console.error('Scan error:', error);
    this.snackBar.open('Error scanning QR code', 'Close', { duration: 3000 });
  }

  handleScanSuccess(result: string): void {
    if (!this.currentScanType) return;
    console.log(`QR Code scanned (${this.currentScanType}):`, result);
    // Process based on scan type
    if (this.currentScanType === 'attendance') {
      this.processAttendanceScan(Number(result));
      // Show success message
      // this.scanSuccess$.next(result);
    } else if (this.currentScanType === 'gifts') {
      this.processGiftScan(Number(result));
      // Show success message
      // this.scanSuccess$.next(result);
    }
    
    // Reset scan type after processing
    this.currentScanType = null;
  }
  
  private processAttendanceScan(scanResult: number): void {
    // TODO: Implement attendance processing logic
    console.log('Processing attendance for:', scanResult);
    const { slots, currentAttendanceType } = this.generateDateSlots('13-06-2025', '17-06-2025');    
    this.registrationService.processScan(scanResult, currentAttendanceType).subscribe(
      (response) => {
        if(response.attendanceAlreadyMarked){
          alert(`Attendance already marked for ${scanResult}`);
          return;
        }else{
          alert(`Successfully scanned Attendance QR code for ID ${scanResult}`);
        }
        console.log('Attendance processed successfully:', response);
        
      },
      (error) => {
        console.error('Error processing attendance:', error);
        alert(`Failed to scan Attendance QR code for ${scanResult}`);
      }
    );
    // this.attendanceService.recordAttendance(scanResult).subscribe(...);
  }
  
  private processGiftScan(scanResult: number): void {
    // TODO: Implement gift processing logic
    console.log('Processing gift for:', scanResult);
    // Example: Call your gift service
    this.registrationService.processScan(scanResult, 'gifts').subscribe(
      (response) => {
        if(response.giftGiven){
          alert(`Gift already marked for ${scanResult}`);
          return;
        }else{
          alert(`Successfully scanned Gifts QR code for ID ${scanResult}`);
        }
        console.log('Gift processed successfully:', response);
        
      },
      (error) => {
        console.error('Error processing gift:', error);
        alert(`Failed to scan Gifts QR code for ${scanResult}`);
      }
    );
  }

  onOnSpotRegistration(): void {
    this.router.navigate(['/registration']);
  }

  onAttendanceManagement(): void {
    this.router.navigate(['/admin/attendance']);
  }

  onQRScanAttendance(): void {
    console.log('QR Scan for Attendance clicked');
    this.currentScanType = 'attendance';
    this.toggleCamera(true);
  }

  onQRScanGifts(): void {
    console.log('QR Scan for Gifts clicked');
    this.currentScanType = 'gifts';
    this.toggleCamera(true);
  }
  
  onCloseScanner(): void {
    this.toggleCamera(false);
    this.currentScanType = null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Gets the current date and time information
   */
  getCurrentDateTime() {
    const now = new Date();
    return {
      date: now,
      formattedDateTime: now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      formattedDate: now.toLocaleDateString('en-IN'),
      formattedTime: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      timeSlot: now.getHours() < 12 ? 'Fore Noon' : 'Afternoon' as 'Fore Noon' | 'Afternoon'
    };
  }

  /**
   * Generates date slots with attendance types and finds the current attendance type
   */
  generateDateSlots(startDate: string, endDate: string): {
    slots: Array<{
      date: Date,
      formattedDate: string,
      timeSlot: 'Fore Noon' | 'Afternoon',
      attendanceType: string
    }>,
    currentAttendanceType: string;
  } {
    const slots: Array<{
      date: Date,
      formattedDate: string,
      timeSlot: 'Fore Noon' | 'Afternoon',
      attendanceType: string
    }> = [];
    
    console.log('Generating date slots for:', startDate, endDate);
    
    const current = this.getCurrentDateTime();
    let currentAttendanceType: string = '';
    let dayCount= 1;
    
    // Parse start and end dates
    const [startDay, startMonth, startYear] = startDate.split('-').map(Number);
    const [endDay, endMonth, endYear] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    // Generate dates in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Create time slots for each day
      const foreNoon = new Date(d);
      foreNoon.setHours(9, 0, 0, 0);
      
      const afternoon = new Date(d);
      afternoon.setHours(13, 0, 0, 0);
      
      // Format date string
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
      
      // Check if current date matches this day
      const isCurrentDay = d.toDateString() === current.date.toDateString();
      
      // Create time slot entries with attendance types
      const foreNoonSlot = {
        date: foreNoon,
        formattedDate: `${dateStr} (09:00 - 12:00)`,
        timeSlot: 'Fore Noon' as const,
        attendanceType: `ATTENDANCE_DAY${dayCount}_FN`
      };
      
      const afternoonSlot = {
        date: afternoon,
        formattedDate: `${dateStr} (13:00 - 24:00)`,
        timeSlot: 'Afternoon' as const,
        attendanceType: `ATTENDANCE_DAY${dayCount}_AN`
      };
      
      // Check if this is the current time slot
      if (isCurrentDay) {
        if (current.timeSlot === 'Fore Noon' && current.date.getHours() <= 9 && current.date.getHours() <= 12) {
          currentAttendanceType = foreNoonSlot.attendanceType;
          console.log('Current Attendance Type:', currentAttendanceType);
        } else if (current.timeSlot === 'Afternoon' && current.date.getHours() <= 13 && current.date.getHours() < 24) {
          currentAttendanceType = afternoonSlot.attendanceType;
          console.log('Current Attendance Type:', currentAttendanceType);
        }
      }
      
      // Add both time slots
      slots.push(foreNoonSlot);
      slots.push(afternoonSlot);
      
      dayCount++;
    }
    
    return { slots, currentAttendanceType };
  }
  
  // Example usage
  exampleUsage() {
    console.log('Example Usage:');
    const { slots, currentAttendanceType } = this.generateDateSlots('06-06-2025', '10-06-2025');
    console.log('Generated Date Slots:', slots);
    console.log('Current Attendance Type:', currentAttendanceType);
    
    const current = this.getCurrentDateTime();
    console.log('Current Date/Time:', current.formattedDateTime);
    console.log('Current Time Slot:', current.timeSlot);
  }
}
