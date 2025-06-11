import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {  RegistrationService } from '../../services/registration.service';
import { AttendanceData, RegistrationFormData, RegistrationListResponse, RegistrationResponse } from '../../models/registration-form-data.model';
import { AuthService } from 'src/app/services/auth.service';

export interface AttendanceRecord {
  id: number;
  fullName: string;
  phone: string;
  aadhaar: string;
  scholarIn: string;
  sakai: string;
  registrationDate: string;
  travelCharges: number;
  sambavanai: number;
  totalAmount: number;
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
  attendanceRecords: RegistrationResponse[] = [];
  attendanceLog: AttendanceData | {} = {};
  currentPage = 1;
  itemsPerPage = 100;
  searchText = '';
  
  isLoading = false;
  errorMessage = '';

  startDate: string = '';
  endDate: string = '';

  idSearchText = '';
  isEditing = false;

  filteredRecords: RegistrationResponse[] = [];

  constructor(
    private router: Router,
    private registrationService: RegistrationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAttendanceData();
  }


  checkRole(): string | null {
    const user = this.authService.getCurrentUser();

    if (user?.role?.includes('ADMIN') || user?.username.toLowerCase() === 'admin') {
      return 'ADMIN';
    } else if (user?.role?.includes('USER') || user?.username.toLowerCase() === 'user') {
      return 'USER';
    }
    return null;
  }

  // Toggle edit mode only for admins
  toggleEdit(): void {
    if (this.checkRole() === 'ADMIN') {
      this.isEditing = !this.isEditing;
    }
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations: RegistrationListResponse) => {
        this.attendanceRecords = registrations;
        this.filteredRecords = [...registrations];
        console.log("Filtered Records",this.filteredRecords);
        
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
   // Check if we should show edit controls
   canEdit(): boolean {
    return this.checkRole() === 'ADMIN' && this.isEditing;
  }

  editRecord(record: AttendanceRecord): void {
    if (!this.canEdit()) return;
    console.log('Editing record:', record);
    // You can open a modal or navigate to an edit form here
  }

  onTravelChange(record: RegistrationResponse, value: number): void {
    if (!this.canEdit()) return;

    if (!record.attendanceAndGifts) {
      record.attendanceAndGifts = {
        travelCharge: 0,
        sambavanai: 0,
        totalAmount: 0
      };
    }
    
    // Update the model value
    record.attendanceAndGifts.travelCharge = value;
    // Calculate total amount
    record.attendanceAndGifts.totalAmount = value + (record.attendanceAndGifts.sambavanai || 0);
  }

  onSambavanaiChange(record: RegistrationResponse, value: number): void {
    if (!this.canEdit()) return;

    if (!record.attendanceAndGifts) {
      record.attendanceAndGifts = {
        travelCharge: 0,
        sambavanai: 0,
        totalAmount: 0
      };
    }    
    // Update the model value
    record.attendanceAndGifts.sambavanai = value;
    // Calculate total amount
    record.attendanceAndGifts.totalAmount = (record.attendanceAndGifts.travelCharge || 0) + value;
  }

  onDayAttendanceChange(record: RegistrationResponse, value: boolean, day: string, session: string): void {
    if (!this.canEdit()) return;
    console.log("record",record);
    console.log("value",value);
    console.log("day",day);
    if (!record.attendanceAndGifts) {

      record.attendanceAndGifts = {
        day1FnAttendance: false,
        day1AnAttendance: false,
        day2FnAttendance: false,
        day2AnAttendance: false,
        day3FnAttendance: false,
        day3AnAttendance: false,
        day4FnAttendance: false,
        day4AnAttendance: false,
        day5FnAttendance: false,
        day5AnAttendance: false,
      };
    }
    if (day === 'day1' && session === 'FN') {
      record.attendanceAndGifts.day1FnAttendance = value;
    } else if (day === 'day1' && session === 'AN') {
      record.attendanceAndGifts.day1AnAttendance = value;
    } else if (day === 'day2' && session === 'FN') {
      record.attendanceAndGifts.day2FnAttendance = value;
    } else if (day === 'day2' && session === 'AN') {
      record.attendanceAndGifts.day2AnAttendance = value;
    } else if (day === 'day3' && session === 'FN') {
      record.attendanceAndGifts.day3FnAttendance = value;
    } else if (day === 'day3' && session === 'AN') {
      record.attendanceAndGifts.day3AnAttendance = value;
    } else if (day === 'day4' && session === 'FN') {
      record.attendanceAndGifts.day4FnAttendance = value;
    } else if (day === 'day4' && session === 'AN') {
      record.attendanceAndGifts.day4AnAttendance = value;
    } else if (day === 'day5' && session === 'FN') {
      record.attendanceAndGifts.day5FnAttendance = value;
    } else if (day === 'day5' && session === 'AN') {
      record.attendanceAndGifts.day5AnAttendance = value;
    }
    // record.attendanceAndGifts.day1FnAttendance = value || false;
  }

 updateTravelCharges(record: RegistrationResponse): void {

// Create charges object with numbers
    const charges = {
      travelCharge: record?.attendanceAndGifts?.travelCharge || 0,
      sambavanai: record?.attendanceAndGifts?.sambavanai || 0,
      totalAmount: record?.attendanceAndGifts?.totalAmount || 0
    };
this.attendanceLog = {
  day1FnAttendance: record?.attendanceAndGifts?.day1FnAttendance,
  day1AnAttendance: record?.attendanceAndGifts?.day1AnAttendance,
  day2FnAttendance: record?.attendanceAndGifts?.day2FnAttendance,
  day2AnAttendance: record?.attendanceAndGifts?.day2AnAttendance,
  day3FnAttendance: record?.attendanceAndGifts?.day3FnAttendance,
  day3AnAttendance: record?.attendanceAndGifts?.day3AnAttendance,
  day4FnAttendance: record?.attendanceAndGifts?.day4FnAttendance,
  day4AnAttendance: record?.attendanceAndGifts?.day4AnAttendance,
  day5FnAttendance: record?.attendanceAndGifts?.day5FnAttendance,
  day5AnAttendance: record?.attendanceAndGifts?.day5AnAttendance,
}
this.registrationService.updateCharges(record.registration.id, charges, this.attendanceLog).subscribe({
  next: () => {
    alert('Charges updated successfully');
  },
  error: (err) => {
    console.error('Error updating charges:', err);
    alert('Failed to update charges: ' + err.message);
  }
});
 }

 
printIdCard(record: RegistrationResponse): void {
    this.registrationService.getQRImage(record.registration.id).subscribe({
      next: (blob: Blob) => {
        const qrCodeUrl = URL.createObjectURL(blob);
        
        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Create the print content
        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Print ID Card</title>
            <style>
           
              @page {
                margin: 0;
                size: 100mm 125mm;
              }
              @media print {
                html, body {
                  width: 100mm;
                  height: 125mm;
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                }
                body * {
                  visibility: hidden;
                }
                .id-card, .id-card * {
                  visibility: visible;
                }
                .id-card {
                  position: absolute;
                  left: 0;
                  top: 0;
                  margin: 0;
                  padding: 0;
                  box-shadow: none !important;
                }
              }

              body { 
                margin: 0; 
                padding: 0;
                width: 100mm;
                height: 125mm;
                display: flex; 
                justify-content: center; 
                align-items: center;
                background: white;
                position: relative;
              }
              .id-card {
                font-family: Arial, sans-serif; 
                width: 100%;
                height: 100%;
                border: 1px solid #333; 
                padding: 0; 
                text-align: left; 
                display: flex; 
                flex-direction: column;
                align-items: center;
                background: white;
                box-sizing: border-box;
                position: relative;
                padding-top: 150px;
                padding-left:25px
              }
              }
                
            </style>
          </head>           
             <body>
            <div class="id-card">
              <!-- Header with Logo/Title -->
              <div style="text-align: center; margin-bottom: 1px; width: 100%;">
          
              </div>
              
              <div style="display: flex; margin: 1px 0; padding: 0 1px; width: 100%;">
    <div style="width: 70px; font-size: 15px; color: #555;">Name:</div>
    <div style="font-size: 15px; font-weight: bold; flex: 1; padding: 1px 0 1px 1px;">
      ${record.registration.fullName}
    </div>
  </div>
  
  <!-- ID Number -->
  <div style="display: flex; margin: 1px 0; padding: 0 1px; width: 100%;">
    <div style="width: 70px; font-size: 15px; color: #555;">ID No:</div>
    <div style="font-size: 15px; font-weight: bold; flex: 1; padding: 1px 0 1px 1px;">
      ${record.registration.id}
    </div>
  </div>
              
              <!-- Vedham -->
  <div style="display: flex; margin: 1px 0; padding: 0 1px; width: 100%;">
    <div style="width: 70px; font-size: 15px; color: #555;">Vedham:</div>
    <div style="font-size: 15px; font-weight: bold; flex: 1; padding: 1px 0 1px 1px;">
      ${record.registration.scholarIn || 'N/A'}
    </div>
  </div>
  
  <!-- Shakai -->
  <div style="display: flex; margin: 1px 0 1px 0; padding: 0 1px; width: 100%;">
    <div style="width: 70px; font-size: 15px; color: #555;">Shakai:</div>
    <div style="font-size: 15px; font-weight: bold; flex: 1; padding: 1px 0 1px 1px;">
      ${record.registration.sakai || 'N/A'}
    </div>
  </div>
  
  <!-- QR Code -->
  <div style="text-align: center; margin: 10px 0 5px 0;padding-top:10px width: 100%;">
  <div style=" font-size: 15px; color: #555;padding-bottom:5px">QR Code:</div>
    <img src="${qrCodeUrl}" alt="QR Code" style="width: 180px; height: 180px;  padding-top: 3px;">
  </div>
  
          </body>
          </html>
        `;

        // Write content to iframe
        const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(printContent);
          iframeDoc.close();
          
          // For mobile browsers that don't support window.print() in iframes
          const printIframe = () => {
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
              }
            } catch (e) {
              console.error('Error printing:', e);
              // Fallback to window.print() if iframe print fails
              window.print();
            }
          };
          
          // Wait for iframe to load before printing
          iframe.onload = printIframe;
        }

        // Clean up
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(qrCodeUrl);
        }, 10000); // Give enough time for printing to complete
      },
      error: (err) => {
        console.error('Error loading QR code:', err);
        alert('Failed to load QR code. Please try again.');
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


updateFilteredRecords(): void {
  // If no search criteria, return all records
  if ((!this.searchText || this.searchText.trim() === '') && 
      (!this.idSearchText || this.idSearchText.trim() === '')) {
    this.filteredRecords = [...this.attendanceRecords];
    return;
  }

  const searchLower = this.searchText ? this.searchText.toLowerCase().trim() : '';
  const idSearch = this.idSearchText ? this.idSearchText.trim() : '';

  this.filteredRecords = this.attendanceRecords.filter(record => {
    // If ID search is provided and doesn't match, filter out
    if (idSearch && !record.registration.id.toString().includes(idSearch)) {
      return false;
    }

    // If no text search, return records that matched the ID search
    if (!searchLower) {
      return true;
    }

    // Check text search against all relevant fields
    return (
      (record.registration.fullName && 
       record.registration.fullName.toLowerCase().includes(searchLower)) ||
      (record.registration.phone && 
       record.registration.phone.includes(searchLower)) ||
      (record.registration.scholarIn && 
       record.registration.scholarIn.toLowerCase().includes(searchLower)) ||
      (record.registration.sakai && 
       record.registration.sakai.toLowerCase().includes(searchLower))
    );
  });

  // Reset to first page when search changes
  this.currentPage = 1;
}

onSearchChange(): void {
  this.updateFilteredRecords();
}
  get paginatedRecords(): RegistrationResponse[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRecords.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.itemsPerPage);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredRecords.length);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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

  printAll(): void {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    this.isLoading = true;
    
    // Format dates to YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    // Fetch registrations with QR codes for the selected date range
    this.registrationService.getAllIds(
      formatDate(this.startDate), 
      formatDate(this.endDate)
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (!response || !Array.isArray(response) || response.length === 0) {
          alert('No registrations found for the selected date range');
          return;
        }

        // Transform the response to match the expected format for openPrintWindow
        const qrData = response.map(item => {

          const base64String = item.qrCodeIdentifier;
          const byteCharacters = atob(base64String);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const imageBlob = new Blob([byteArray], { type: 'image/png' });
          const imageUrl = URL.createObjectURL(imageBlob);

          return{
          registration: {
            id: item.id,
            fullName: item.registration.fullName,
            scholarIn: item.registration.scholarIn,
            sakai: item.registration.sakai,
          },
          qrCodeIdentifier: imageUrl
      }
        });

        this.openPrintWindow(qrData);
      },
      error: (error) => {
        console.error('Error fetching registration data:', error);
        this.isLoading = false;
        alert('Failed to load registration data. Please try again.');
      }
    });
  }

  private openPrintWindow(data: any[]): void {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Pop-up was blocked. Please allow pop-ups for this site and try again.');
      return;
    }

    // Create HTML content for displaying ID cards
    const pageContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ID Cards</title>
        <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
              
              @page {
                margin: 0;
                padding: 0;
              }
              
            @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                }

                .container {
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: space-between;
                  gap: 20px;
                  padding: 20px;
                  width: 100%;
                  margin: 0;
                }

                .id-card {
                  border: 2px solid #333 !important;
                  box-shadow: none !important;
                  margin: 0;
                  page-break-inside: avoid;
                  min-width: 33%;
                  flex: 0 0 31%;
                  max-width: 31%;
                }

                @page {
                  size: A4;
                  margin: 20mm;
                }

                @page :first {
                  margin-top: 0;
                }
              }
               body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                min-height: 100vh;
              }
              
              .container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
                padding: 20px;
              }
              
              .id-card { 
                font-family: Arial, sans-serif; 
                max-width: 300px; 
                margin: 0 auto; 
                border: 2px solid #333; 
                padding: 25px; 
                text-align: center; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              
              .header { 
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                text-transform: uppercase;
                letter-spacing: 1px;
                color:#000;
              }
              
              .qr-code { 
                max-width: 100%;
                height: 100px;
                display: block;
                margin: 0 auto;
              }
              
              .details { 
                margin-top: 10px;
                position: relative;
                z-index: 1;
              }
              
              .detail-row {
                margin: 8px 0;
                display: flex;
                align-items: center;
              }
              
              .label {
                font-size: 12px;
                color: #000;
                width: 70px;
                display: inline-block;
              }
              
              .value {
                font-size: 14px;
                font-weight: 500;
              }
              
              .id-number {
                background: rgba(255, 255, 255, 0.15);
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 13px;
                margin-top: 10px;
                display: inline-block;
                font-family: monospace;
                letter-spacing: 1px;
              }
            </style>
      </head>
      <body>
        <div class="container">
          ${data.map(item => `
            <div class="id-card">
              <div class="header">Saptathi Mahotsavam</div>
              <div class="details">
                <div class="detail-row">
                  <span class="label">ID:</span>
                  <span class="value">${item.registration.id}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">${item.registration.fullName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Scholar In:</span>
                  <span class="value">${item.registration.scholarIn}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Sakai:</span>
                  <span class="value">${item.registration.sakai}</span>
                </div>
                ${item.qrCodeIdentifier ? `
                  <div class="qr-code">
                    <img src="${item.qrCodeIdentifier}" alt="QR Code" width="120" height="120">
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    // Write the content to the new window
    newWindow.document.open();
    newWindow.document.write(pageContent);
    newWindow.document.close();
  }
}
