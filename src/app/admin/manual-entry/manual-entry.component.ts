import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';

@Component({
  selector: 'app-manual-entry',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.css']
})
export class ManualEntryComponent implements OnInit {
  selectedTabIndex = 0;
  registrationId: number = 0;
  giftCode: number = 0;
  errorMessage: string = '';
  isLoading = false;
  currentScanType: 'attendance' | 'gift' | null = null;
  
  slots: Array<{
    date: Date,
    formattedDate: string,
    timeSlot: 'Fore Noon' | 'Afternoon',
    attendanceType: string
  }> = [];
  
  currentAttendanceType: string = '';

  constructor(
    private registrationService: RegistrationService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onRegisterAttendance(): void {
    if (!this.registrationId) {
      this.showError('Please enter a registration ID');
      return;
    }
    
    // Convert the registration ID to a number to handle leading zeros
    const registrationId = Number(this.registrationId);
    if (isNaN(registrationId)) {
      this.showError('Please enter a valid registration ID');
      return;
    }
    
    this.currentScanType = 'attendance';
    
    // Generate date slots and get current attendance type
    const { slots, currentAttendanceType } = this.generateDateSlots(
      '13-06-2025', 
      '17-06-2025'
    );
    
    this.slots = slots;
    this.currentAttendanceType = currentAttendanceType;
    
    if (!this.currentAttendanceType) {
      this.showError('No valid attendance slot found for the current time');
      this.isLoading = false;
      return;
    }

    console.log("Current Attendance Type:", this.currentAttendanceType);
    
    this.isLoading = true;
    
    // Call the registration service with the attendance type
    this.registrationService.processScan(registrationId, this.currentAttendanceType).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if(response.attendanceAlreadyMarked){
          this.showSuccess(`Attendance already marked for ${this.registrationId}`);
          return;
        }else{
          this.showSuccess(`Successfully scanned Attendance QR code for ID ${this.registrationId}`);
        }
        console.log('Attendance processed successfully:', response);
        
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Failed to register attendance');
      }
    });
  }

  onRegisterGift(): void {
    if (!this.giftCode) {
      this.showError('Please enter a gift code');
      return;
    }
    
    // Convert the gift code to a number to handle leading zeros
    const giftCode = Number(this.giftCode);
    if (isNaN(giftCode)) {
      this.showError('Please enter a valid gift code');
      return;
    }
    
    this.currentScanType = 'gift';

    this.registrationService.processScan(giftCode, this.currentScanType).subscribe({
      next: (response: any) => {

        this.isLoading = false;
        if(response.giftGiven){
          this.showSuccess(`Gift already marked for ${this.giftCode}`);
          return;
        }else{
          this.showSuccess(`Successfully scanned Gifts QR code for ID ${this.giftCode}`);
        }
        console.log('Gift processed successfully:', response);
        
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Failed to register gift');
      }
    });

    this.isLoading = true;
  }

  onBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  private showSuccess(message: string): void {
    alert(`✓ ${message}`);
  }

  private showError(message: string): void {
    alert(`✗ ${message}`);
  }
  
  // Gets the current date and time information
  private getCurrentDateTime() {
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
  
  // Generates date slots with attendance types and finds the current attendance type
  private generateDateSlots(startDate: string, endDate: string): {
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
    let dayCount = 1;
    
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
        if (current.timeSlot === 'Fore Noon' && current.date.getHours() >= 9 && current.date.getHours() <= 12) {
          currentAttendanceType = foreNoonSlot.attendanceType;
          console.log('Current Attendance Type:', currentAttendanceType);
        } else if (current.timeSlot === 'Afternoon' && current.date.getHours() >= 13 && current.date.getHours() < 24) {
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
}
