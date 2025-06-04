import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';
import { RegistrationFormData } from '../../models/registration-form-data.model';

export interface AttendanceRecord {
  id: number;
  fullName: string;
  phone: string;
  scholarIn: string;
  sakai: string;
  registrationDate: string;
  days: {
    day1: { forenoon: boolean; afternoon: boolean };
    day2: { forenoon: boolean; afternoon: boolean };
    day3: { forenoon: boolean; afternoon: boolean };
    day4: { forenoon: boolean; afternoon: boolean };
    day5: { forenoon: boolean; afternoon: boolean };
  };
  gifted: boolean;
}

@Component({
  selector: 'app-attendance-management',
  templateUrl: './attendance-management.component.html',
  styleUrls: ['./attendance-management.component.css']
})
export class AttendanceManagementComponent implements OnInit {
  attendanceList: AttendanceRecord[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  searchText = '';
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private registrationService: RegistrationService
  ) { }

  ngOnInit(): void {
    this.loadAttendanceData();
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.registrationService.getRegistrations().subscribe({
      next: (registrations: RegistrationFormData[]) => {
        // Transform registration data to attendance records
        this.attendanceList = registrations.map((reg, index) => ({
          id: reg.id || index + 1,
          fullName: reg.fullName,
          phone: reg.phone,
          scholarIn: reg.scholarIn,
          sakai: reg.sakai,
          registrationDate: reg.registrationDate || new Date().toISOString().split('T')[0],
          days: {
            day1: { forenoon: false, afternoon: false },
            day2: { forenoon: false, afternoon: false },
            day3: { forenoon: false, afternoon: false },
            day4: { forenoon: false, afternoon: false },
            day5: { forenoon: false, afternoon: false }
          },
          gifted: false
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.errorMessage = 'Failed to load registration data. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  toggleAttendance(record: AttendanceRecord, day: string, session: 'forenoon' | 'afternoon'): void {
    record.days[day as keyof typeof record.days][session] = !record.days[day as keyof typeof record.days][session];
    // TODO: Call API to update attendance
  }


  printIdCard(record: any): void {
    // Store the current record for the ID card
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; border: 2px solid #333; padding: 20px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; color: #2c3e50;">Participant ID Card</h2>
        <div style="border-bottom: 1px solid #eee; margin-bottom: 15px; padding-bottom: 15px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${record.name}</div>
          <div style="color: #666; margin-bottom: 5px;">${record.scholar}</div>
          <div style="color: #666; margin-bottom: 5px;">${record.shaka}</div>
          <div style="color: #666;">ID: ${record.id}</div>
        </div>
        <div style="font-size: 12px; color: #777; margin-top: 15px;">
          Valid for the event period
        </div>
      </div>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ID Card - ${record.name}</title>
            <style>
              @media print {
                @page { size: auto; margin: 5mm; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  get filteredRecords(): AttendanceRecord[] {
    if (!this.searchText) return this.attendanceList;
    const searchLower = this.searchText.toLowerCase();
    return this.attendanceList.filter(record => 
      record.fullName.toLowerCase().includes(searchLower) ||
      record.phone.includes(this.searchText) ||
      record.scholarIn.toLowerCase().includes(searchLower) ||
      record.sakai.toLowerCase().includes(searchLower)
    );
  }

  get paginatedRecords(): AttendanceRecord[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRecords.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  exportToExcel(): void {
    // TODO: Implement export to Excel functionality
    console.log('Exporting attendance data to Excel...');
    // This would typically use a library like xlsx to export data
  }
}
