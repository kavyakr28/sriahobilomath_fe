import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  scan,
  shareReplay,
  startWith,
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
    private snackBar: MatSnackBar
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
      this.processAttendanceScan(result);
      // Show success message
      alert(`Successfully scanned ${this.currentScanType} QR code`);
      this.scanSuccess$.next(result);
    } else if (this.currentScanType === 'gifts') {
      this.processGiftScan(result);
      // Show success message
      alert(`Successfully scanned ${this.currentScanType} QR code`);
      this.scanSuccess$.next(result);
    }
    
    // Reset scan type after processing
    this.currentScanType = null;
  }
  
  private processAttendanceScan(scanResult: string): void {
    // TODO: Implement attendance processing logic
    console.log('Processing attendance for:', scanResult);
    // Example: Call your attendance service
    // this.attendanceService.recordAttendance(scanResult).subscribe(...);
  }
  
  private processGiftScan(scanResult: string): void {
    // TODO: Implement gift processing logic
    console.log('Processing gift for:', scanResult);
    // Example: Call your gift service
    // this.giftService.processGift(scanResult).subscribe(...);
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
}
