import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  constructor(private router: Router, private authService: AuthService) {}

  logout(): void {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  onQRScanAttendance(): void {
    // TODO: Implement QR scan for attendance functionality
    console.log('QR Scan for Attendance clicked');
  }

  onQRScanGifts(): void {
    // TODO: Implement QR scan for gifts functionality
    console.log('QR Scan for Gifts clicked');
  }

  onAttendanceManagement(): void {
    // TODO: Implement attendance management functionality
    console.log('Attendance Management clicked');
  }

  onOnSpotRegistration(): void {
    // TODO: Implement on-spot registration functionality
    console.log('On-Spot Registration clicked');
    this.router.navigate(['/registration']);
  }
}
