import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {  RegistrationService } from '../../services/registration.service';
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

  startDate: string = '';
  endDate: string = '';

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
              @media print {
                body { -webkit-print-color-adjust: exact; }
                @page { margin: 0; size: 100mm 150mm; }
              }
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                min-height: 100vh;
              }
              .id-card {
                font-family: Arial, sans-serif; 
                max-width: 300px; 
                margin: 0 auto; 
                border: 2px solid #333; 
                padding: 20px; 
                text-align: center; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .qr-container {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin: 10px 0;
                width: 100%;
                box-sizing: border-box;
              }
              .qr-container img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="id-card">
              <h2 style="margin: 0 0 15px 0; color: #fff; text-shadow: 1px 1px 2px rgba(15, 15, 15, 0.96); border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px; width: 100%;">Saptathi Mahotsavam</h2>
              
              <div style="margin-bottom: 15px; font-size: 20px; font-weight: bold; width: 100%; background: rgba(255,255,255,0.8); padding: 8px; border-radius: 4px;">
                ${record.fullName}
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; text-align: center; padding: 0 10px; width: 100%; gap: 10px;">
                <div style="flex: 1; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 4px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Scholar</div>
                  <div style="font-weight: 600; color: #2c3e50;">${record.scholarIn}</div>
                </div>
                <div style="flex: 1; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 4px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Shaka</div>
                  <div style="font-weight: 600; color: #2c3e50;">${record.sakai}</div>
                </div>
              </div>
              
              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="QR Code" onload="window.print()">
              </div>
            </div>
            
            <script>
              // Fallback in case onload doesn't fire
              setTimeout(() => { window.print(); }, 1000);
              
              // Close after print (for mobile)
              window.onafterprint = function() {
                window.close();
              };
            </script>
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
