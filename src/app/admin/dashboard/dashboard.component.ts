import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }


  ngOnInit(): void {
    
  }


  
  onOnSpotRegistration(): void {
    this.router.navigate(['/registration']);
  }

  onAttendanceManagement(): void {
  }

  onQRScanAttendance(): void {
    console.log('QR Scan for Attendance clicked');
    // TODO: Implement QR scan for attendance functionality
  }

  onQRScanGifts(): void {
    console.log('QR Scan for Gifts clicked');
    // TODO: Implement QR scan for gifts functionality
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
