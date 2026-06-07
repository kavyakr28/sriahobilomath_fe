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
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  // Scanner properties
  allowedFormats = [BarcodeFormat.QR_CODE];
  currentScanType: 'attendance' | 'gift' | null = null;
  
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

  private lastScannedCode: string | null = null;
  private isProcessing = false;
  
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
    private registrationService: RegistrationService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  scanError(error: Error) {
    console.error('Scan error:', error);
    this.snackBar.open('Error scanning QR code', 'Close', { duration: 3000 });
  }

  handleScanSuccess(result: string): void {
    // Skip if already processing or same code was just processed
    if (this.isProcessing || this.lastScannedCode === result) {
      return;
    }

    if (!this.currentScanType) return;
    
    console.log(`QR Code scanned (${this.currentScanType}):`, result);
    
    // Set processing flag and store the last scanned code
    this.isProcessing = true;
    this.lastScannedCode = result;

    // Process based on scan type
    if (this.currentScanType === 'attendance') {
      this.processAttendanceScan(Number(result));
    } else if (this.currentScanType === 'gift') {
      this.processGiftScan(Number(result));
    }

    // Reset the last scanned code after a short delay to allow the same code to be scanned again if needed
    setTimeout(() => {
      this.lastScannedCode = null;
      this.isProcessing = false;
    }, 3000);
  }
  
  private processAttendanceScan(scanResult: number): void {
    // TODO: Implement attendance processing logic
    console.log('Processing attendance for:', scanResult);
    const { slots, currentAttendanceType } = this.generateDateSlots('26-11-2025', '30-11-2025');    
    this.registrationService.processScan(scanResult, currentAttendanceType).subscribe(
      (response) => {
        console.log("Response value : ", response);
        if(response.attendanceAlreadyMarked){
          this.toastr.warning(
            `Attendance already marked for ${scanResult}`,
            '',
            { timeOut: 3000 }
          );
          return;
        }else{
          this.toastr.success(
            `Successfully scanned Attendance QR code for ID ${scanResult}`,
            '',
            { timeOut: 3000 }
          );
        }
        console.log('Attendance processed successfully:', response);
        
      },
      (error) => {
        console.error('Error processing attendance:', error);

        this.toastr.error(
          `Failed to scan Attendance QR code for ${scanResult}`,
          '',
          { timeOut: 3000 }
        );
      }
    );
    // this.attendanceService.recordAttendance(scanResult).subscribe(...);
  }
  
  private processGiftScan(scanResult: number): void {
    // TODO: Implement gift processing logic
    console.log('Processing gift for:', scanResult);
    // Example: Call your gift service
    this.registrationService.processScan(scanResult, 'gift').subscribe(
      (response) => {
        if(response.giftAlreadyMarked){
          this.toastr.warning(
            `Gift already marked for ${scanResult}`,
            '',
            { timeOut: 3000 }
          );
          return;
        }else{
          this.toastr.success(
            `Successfully scanned Gifts QR code for ID ${scanResult}`,
            '',
            { timeOut: 3000 }
          );
        }
        console.log('Gift processed successfully:', response);
        
      },
      (error) => {
        console.error('Error processing gift:', error);
        this.toastr.error(
          `Failed to scan Gift QR code for ${scanResult}`,
          '',
          { timeOut: 3000 }
        );
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
    this.currentScanType = 'gift';
    this.toggleCamera(true);
  }

  onManualEntry(): void {
    this.router.navigate(['/manual-entry']);
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
      timeSlot: (now.getHours() >= 6 && now.getHours() < 12) ? 'Fore Noon' : (now.getHours() >= 14 && now.getHours() < 20) ? 'Afternoon' : 'Afternoon' as 'Fore Noon' | 'Afternoon'
    };
  }

  checkRole(): string | null {
    const user = this.authService.getCurrentUser();
    if (user?.includes('ADMIN') || user?.toLowerCase() === 'admin') {
      return 'ADMIN';
    } else if (user?.includes('USER') || user?.toLowerCase() === 'user') {
      return 'USER';
    }
    return null;
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
      // Create time slots for each day with specific hours
      const foreNoonStart = new Date(d);
      foreNoonStart.setHours(6, 0, 0, 0); // 6:00 AM
      
      const foreNoonEnd = new Date(d);
      foreNoonEnd.setHours(12, 0, 0, 0); // 12:00 PM
      
      const afternoonStart = new Date(d);
      afternoonStart.setHours(14, 0, 0, 0); // 4:00 PM
      
      const afternoonEnd = new Date(d);
      afternoonEnd.setHours(20, 0, 0, 0); // 8:00 PM
      
      // Format date string
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
    
    // Check if current date matches this day
    const isCurrentDay = d.toDateString() === current.date.toDateString();
    
    // Create time slot entries with specific time ranges
    const foreNoonSlot = {
      date: foreNoonStart,
      formattedDate: `${dateStr} (06:00 - 12:00)`,
      timeSlot: 'Fore Noon' as const,
      attendanceType: `ATTENDANCE_DAY${dayCount}_FN`
    };
    
    const afternoonSlot = {
      date: afternoonStart,
      formattedDate: `${dateStr} (14:00 - 20:00)`,
      timeSlot: 'Afternoon' as const,
      attendanceType: `ATTENDANCE_DAY${dayCount}_AN`
    };  
      
      // Check if this is the current time slot
      if (isCurrentDay) {
        const currentHour = current.date.getHours();
        if (current.timeSlot === 'Fore Noon' && currentHour >= 6 && currentHour < 12) {
          currentAttendanceType = foreNoonSlot.attendanceType;
          console.log('Current Attendance Type:', currentAttendanceType);
        } else if (current.timeSlot === 'Afternoon' && currentHour >= 14 && currentHour < 20) {
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
    const { slots, currentAttendanceType } = this.generateDateSlots('26-11-2025', '30-11-2025');
    console.log('Generated Date Slots:', slots);
    console.log('Current Attendance Type:', currentAttendanceType);
    
    const current = this.getCurrentDateTime();
    console.log('Current Date/Time:', current.formattedDateTime);
    console.log('Current Time Slot:', current.timeSlot);
  }
}
