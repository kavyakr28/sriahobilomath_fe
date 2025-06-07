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


 
printIdCard(record: AttendanceRecord): void {
  this.registrationService.getQRImage(record.id).subscribe({
    next: (blob: Blob) => {
      // Create object URL from the blob
      const qrCodeUrl = URL.createObjectURL(blob);
      
      // Create the print content with the record details and QR code
      const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; border: 2px solid #333; padding: 20px; text-align: center;">
          <h2 style="margin: 0 0 15px 0; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">Saptathi Mahotsavam</h2>
          
          <div style="margin-bottom: 15px; font-size: 20px; font-weight: bold;">${record.fullName}</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px; text-align: left; padding: 0 20px;">
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Scholar</div>
              <div style="font-weight: 500;">${record.scholarIn}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Shaka</div>
              <div style="font-weight: 500;">${record.sakai}</div>
            </div>
          </div>
          
          <div style="margin: 15px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
          </div>
          
        </div>
      `;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>ID Card - ${record.fullName}</title>
              <style>
                @media print {
                  @page { 
                    size: auto; 
                    margin: 10mm;
                  }
                  body { 
                    margin: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
                @page {
                  size: 80mm 120mm;
                  margin: 0;
                }
              </style>
            </head>
            <body onload="window.print(); window.onafterprint = function() { window.close(); }">
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    },
    error: (error) => {
      console.error('Error loading QR code:', error);
      // Fallback if QR code fails to load
      this.showFallbackPrint(record);
    }
  });
}

private showFallbackPrint(record: AttendanceRecord): void {
  const printContent = `
    <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; border: 2px solid #333; padding: 20px; text-align: center;">
      <h2 style="margin: 0 0 15px 0; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">Participant ID</h2>
      
      <div style="margin-bottom: 15px; font-size: 20px; font-weight: bold;">${record.fullName}</div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; text-align: left; padding: 0 20px;">
        <div>
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Scholar</div>
          <div style="font-weight: 500;">${record.scholarIn}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Shaka</div>
          <div style="font-weight: 500;">${record.sakai}</div>
        </div>
      </div>
      
      <div style="margin: 15px 0; padding: 30px; background-color: #f8f9fa; border-radius: 4px; color: #999; font-style: italic;">
        QR Code not available
      </div>
      
      <div style="font-size: 12px; color: #777; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
        ID: ${record.id} | ${new Date(record.registrationDate).toLocaleDateString()}
      </div>
    </div>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${record.fullName}</title>
          <style>
            @media print {
              @page { 
                size: auto; 
                margin: 10mm;
              }
              body { 
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            @page {
              size: 80mm 120mm;
              margin: 0;
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = function() { window.close(); }">
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
