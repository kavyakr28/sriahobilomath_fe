import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';
import { AttendanceData, RegistrationFormData, RegistrationListResponse, RegistrationResponse } from '../../models/registration-form-data.model';
import { AuthService } from 'src/app/services/auth.service';
import { PadNumberPipe } from '../../pipes/pad-number.pipe';


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
  styleUrls: ['./attendance-management.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PadNumberPipe]
})
export class AttendanceManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('dataTable') dataTable!: ElementRef<HTMLTableElement>;
  
  // Scrollbar properties
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  scrollThumbPosition = 0;
  maxScrollLeft = 0;
  private resizeSubscription?: Subscription;
  attendanceList: AttendanceRecord[] = [];
  attendanceRecords: RegistrationResponse[] = [];
  attendanceLog: AttendanceData | {} = {};
  giftGiven: boolean = false;
  accommodation: string = '';
  currentPage = 1;
  itemsPerPage = 100;
  searchText = '';
  
  isLoading = false;
  errorMessage = '';

  startDate: string = '';
  endDate: string = '';

  idSearchText = '';
  isEditing = false;
  isExporting = false;
  isExportingAll = false;

  filteredRecords: RegistrationResponse[] = [];
  
  accommodationOptions = [
    'Yatri Nivas Non AC',
    'Yatri Nivas AC Cottage',
    'Yatri Nivas AC Room',
    'Yatri Nivas 8 bed AC',
    'VS Mahal',
    'Krishnakumar Mandapam',
    'Hari Kirupa',
    'Own arrangement',
    'Not required'
  ];

  accommodationStats: { [key: string]: number } = {};

  constructor(
    private router: Router,
    private registrationService: RegistrationService,
    private authService: AuthService
  ) {
    // Initialize stats object with all accommodation options
    this.accommodationOptions.forEach(option => {
      this.accommodationStats[option] = 0;
    });
  }

  private calculateAccommodationStats() {
    // Reset stats to zero
    Object.keys(this.accommodationStats).forEach(option => {
      this.accommodationStats[option] = 0;
    });

    // Count scholars for each accommodation option
    this.filteredRecords.forEach(record => {
      if (record.attendanceAndGifts?.accommodation) {
        const options = record.attendanceAndGifts.accommodation.split(',').map(opt => opt.trim());
        options.forEach(option => {
          if (this.accommodationStats[option] !== undefined) {
            this.accommodationStats[option]++;
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    this.setupScrollSync();
    this.updateTableWidth();
    
    // Update max scroll and width when window is resized
    this.resizeSubscription = fromEvent(window, 'resize').pipe(
      debounceTime(100)
    ).subscribe(() => {
      this.updateMaxScroll();
      this.updateTableWidth();
    });
  }

  ngOnDestroy() {
    // Clean up the subscription
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  setupScrollSync() {
    const table = this.dataTable?.nativeElement;
    const tableContainer = table?.parentElement as HTMLElement | null;
    const scrollbarContainer = document.querySelector('.dummy-scrollbar-container') as HTMLElement | null;
    
    if (!table || !tableContainer || !scrollbarContainer) return;
    
    // Initial setup
    this.updateMaxScroll();
    this.updateTableWidth();
    
    // Sync table scroll with dummy scrollbar
    const onScroll = () => {
      if (!this.isDragging) {
        const maxScroll = table.scrollWidth - tableContainer.clientWidth;
        const scrollRatio = maxScroll > 0 ? tableContainer.scrollLeft / maxScroll : 0;
        this.scrollThumbPosition = scrollRatio * (tableContainer.offsetWidth - 40); // 40 is the thumb width
      }
    };
    
    // Update scrollbar width when table content changes
    const observer = new MutationObserver(() => {
      this.updateTableWidth();
      this.updateMaxScroll();
    });
    
    observer.observe(table, { childList: true, subtree: true });
    tableContainer.addEventListener('scroll', onScroll);
    
    // Clean up event listeners and observer on component destroy
    return () => {
      observer.disconnect();
      tableContainer.removeEventListener('scroll', onScroll);
    };
  }
  
  updateMaxScroll() {
    const table = this.dataTable?.nativeElement;
    const tableContainer = table?.parentElement;
    
    if (table && tableContainer) {
      this.maxScrollLeft = Math.max(0, table.scrollWidth - tableContainer.clientWidth);
    } else {
      this.maxScrollLeft = 0;
    }
  }
  
  updateTableWidth() {
    const table = this.dataTable?.nativeElement;
    const tableContainer = table?.parentElement;
    const scrollbarContainer = document.querySelector('.dummy-scrollbar');
    
    if (table && tableContainer && scrollbarContainer) {
      // Get the width of the table's parent container
      const containerWidth = tableContainer.clientWidth;
      const tableWidth = table.scrollWidth;
      
      // Calculate the width of the scrollbar track
      const scrollbarWidth = Math.min(containerWidth, tableWidth);
      
      // Update the scrollbar width
      (scrollbarContainer as HTMLElement).style.width = `${scrollbarWidth}px`;
      
      // Update the thumb width based on the visible area
      const thumbWidth = Math.max(40, (containerWidth / tableWidth) * scrollbarWidth);
      document.documentElement.style.setProperty('--thumb-width', `${thumbWidth}px`);
    }
  }
  
  startDrag(event: MouseEvent | TouchEvent, isThumb = false) {
    // Type guard to handle both MouseEvent and TouchEvent
    const isTouch = 'touches' in event;
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    const pageX = isTouch ? (event as TouchEvent).touches[0].pageX : (event as MouseEvent).pageX;
    
    const target = event.target as HTMLElement;
    const scrollbar = (target.closest('.dummy-scrollbar') || 
                      target.closest('.dummy-scrollbar-thumb')?.parentElement) as HTMLElement;
    if (!scrollbar) return;
    
    this.isDragging = true;
    const scrollbarRect = scrollbar.getBoundingClientRect();
    
    // Prevent text selection during drag and disable pull-to-refresh
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.touchAction = 'none';
    
    if (!isThumb) {
      // Calculate the position where the thumb should be centered
      const clickPosition = clientX - scrollbarRect.left;
      const thumbWidth = this.getThumbWidth();
      let newThumbPosition = clickPosition - (thumbWidth / 2);
      
      // Constrain the thumb within the scrollbar bounds
      const maxPosition = scrollbarRect.width - thumbWidth;
      newThumbPosition = Math.max(0, Math.min(newThumbPosition, maxPosition));
      
      // Update the scroll position
      this.scrollThumbPosition = newThumbPosition;
      this.syncTableScroll();
      
      // Update startX for smooth dragging after click
      this.startX = scrollbarRect.left + newThumbPosition - clientX;
    } else {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const offsetX = isTouch ? clientX - rect.left : (event as any).offsetX || 0;
      this.startX = pageX - offsetX - this.scrollThumbPosition;
    }
    
    // Prevent default for touch events to avoid scrolling the page
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Add touch move/end listeners if this is a touch event
    if (isTouch) {
      const moveHandler = (e: TouchEvent) => this.onDrag(e as any);
      const endHandler = () => this.onDragEnd();
      
      document.addEventListener('touchmove', moveHandler, { passive: false });
      document.addEventListener('touchend', endHandler, { once: true });
      document.addEventListener('touchcancel', endHandler, { once: true });
      
      // Clean up listeners after drag ends
      this.onDragEnd = () => {
        document.removeEventListener('touchmove', moveHandler);
        document.body.style.touchAction = '';
        this.isDragging = false;
      };
    }
  }
  
  private getThumbWidth(): number {
    const thumb = document.querySelector('.dummy-scrollbar-thumb') as HTMLElement;
    return thumb ? thumb.offsetWidth : 40; // Default to 40px if thumb not found
  }
  
  private syncTableScroll() {
    const table = this.dataTable?.nativeElement;
    const tableContainer = table?.parentElement as HTMLElement | null;
    const scrollbar = document.querySelector('.dummy-scrollbar') as HTMLElement;
    
    if (!tableContainer || !scrollbar) return;
    
    const scrollbarWidth = scrollbar.offsetWidth;
    const thumbWidth = this.getThumbWidth();
    const maxScrollLeft = table.scrollWidth - tableContainer.clientWidth;
    const maxThumbPosition = scrollbarWidth - thumbWidth;
    
    if (maxThumbPosition > 0) {
      const scrollRatio = this.scrollThumbPosition / maxThumbPosition;
      tableContainer.scrollLeft = scrollRatio * maxScrollLeft;
    }
  }
  
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    
    const isTouch = 'touches' in event;
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    
    // Prevent default to avoid scrolling the page
    if (event.cancelable) {
      event.preventDefault();
    }
    
    const tableContainer = this.dataTable?.nativeElement?.parentElement as HTMLElement | null;
    if (!tableContainer) return;
    
    // Get the scrollbar element
    const scrollbar = document.querySelector('.dummy-scrollbar') as HTMLElement;
    if (!scrollbar) return;
    
    // Get the scrollbar's position
    const scrollbarRect = scrollbar.getBoundingClientRect();
    
    // Calculate the thumb position relative to the scrollbar
    let x = clientX - scrollbarRect.left - (this.startX - scrollbarRect.left);
    
    // Constrain the thumb within the scrollbar bounds
    const thumbWidth = this.getThumbWidth();
    const maxPosition = scrollbarRect.width - thumbWidth;
    this.scrollThumbPosition = Math.max(0, Math.min(x, maxPosition));
    
    // Update the table scroll position
    this.syncTableScroll();
    
    // Prevent text selection during drag
    if (event.cancelable) {
      event.preventDefault();
    }
    return false;
  }
  
  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  @HostListener('document:mouseleave')
  onDragEnd() {
    if (this.isDragging) {
      this.isDragging = false;
      
      // Re-enable text selection and touch actions
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.touchAction = '';
    }
  }
  
  endDrag() {
    this.isDragging = false;
  }

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

  // Define the type for attendance stats
  private attendanceStats = {
    day1: { fn: 0, an: 0 },
    day2: { fn: 0, an: 0 },
    day3: { fn: 0, an: 0 },
    day4: { fn: 0, an: 0 },
    day5: { fn: 0, an: 0 }
  };

  getAttendanceStats() {
    // Reset stats
    Object.values(this.attendanceStats).forEach(day => {
      day.fn = 0;
      day.an = 0;
    });

    // Calculate stats
    this.attendanceRecords.forEach(record => {
      if (record.attendanceAndGifts) {
        const att = record.attendanceAndGifts;
        if (att.day1FnAttendance) this.attendanceStats.day1.fn++;
        if (att.day1AnAttendance) this.attendanceStats.day1.an++;
        if (att.day2FnAttendance) this.attendanceStats.day2.fn++;
        if (att.day2AnAttendance) this.attendanceStats.day2.an++;
        if (att.day3FnAttendance) this.attendanceStats.day3.fn++;
        if (att.day3AnAttendance) this.attendanceStats.day3.an++;
        if (att.day4FnAttendance) this.attendanceStats.day4.fn++;
        if (att.day4AnAttendance) this.attendanceStats.day4.an++;
        if (att.day5FnAttendance) this.attendanceStats.day5.fn++;
        if (att.day5AnAttendance) this.attendanceStats.day5.an++;
      }
    });

    return this.attendanceStats;
  }

  // Helper method to get stats for a specific day
  getDayStats(day: number) {
    const dayKey = `day${day}` as keyof typeof this.attendanceStats;
    return this.attendanceStats[dayKey] || { fn: 0, an: 0 };
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations: RegistrationListResponse) => {
        this.attendanceRecords = registrations;
        this.filteredRecords = [...registrations];
        console.log("Filtered Records", this.filteredRecords);
        
        // Log attendance stats for debugging
        console.log("Attendance Stats:", this.getAttendanceStats());
        
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
        totalAmount: 0,
        day1FnAttendance: false,
        day1AnAttendance: false,
        day2FnAttendance: false,
        day2AnAttendance: false,
        day3FnAttendance: false,
        day3AnAttendance: false,
        day4FnAttendance: false,
        day4AnAttendance: false,
        day5FnAttendance: false,
        day5AnAttendance: false
      };
    }
    
    // Update the model value
    record.attendanceAndGifts.travelCharge = value;
    
    // Calculate attendance count
    const attendanceCount = [
      record.attendanceAndGifts.day1FnAttendance,
      record.attendanceAndGifts.day1AnAttendance,
      record.attendanceAndGifts.day2FnAttendance,
      record.attendanceAndGifts.day2AnAttendance,
      record.attendanceAndGifts.day3FnAttendance,
      record.attendanceAndGifts.day3AnAttendance,
      record.attendanceAndGifts.day4FnAttendance,
      record.attendanceAndGifts.day4AnAttendance,
      record.attendanceAndGifts.day5FnAttendance,
      record.attendanceAndGifts.day5AnAttendance
    ].filter(Boolean).length;
    
    // Calculate total amount using the formula: (sambavanai * attendanceCount) + travelCharge
    const sambavanai = record.attendanceAndGifts.sambavanai || 0;
    record.attendanceAndGifts.totalAmount = (sambavanai * attendanceCount) + value;
  }

  onSambavanaiChange(record: RegistrationResponse, value: number): void {
    if (!this.canEdit()) return;

    if (!record.attendanceAndGifts) {
      record.attendanceAndGifts = {
        travelCharge: 0,
        sambavanai: 0,
        totalAmount: 0,
        day1FnAttendance: false,
        day1AnAttendance: false,
        day2FnAttendance: false,
        day2AnAttendance: false,
        day3FnAttendance: false,
        day3AnAttendance: false,
        day4FnAttendance: false,
        day4AnAttendance: false,
        day5FnAttendance: false,
        day5AnAttendance: false
      };
    }    
    
    // Update the model value
    record.attendanceAndGifts.sambavanai = value;
    
    // Calculate attendance count
    const attendanceCount = [
      record.attendanceAndGifts.day1FnAttendance,
      record.attendanceAndGifts.day1AnAttendance,
      record.attendanceAndGifts.day2FnAttendance,
      record.attendanceAndGifts.day2AnAttendance,
      record.attendanceAndGifts.day3FnAttendance,
      record.attendanceAndGifts.day3AnAttendance,
      record.attendanceAndGifts.day4FnAttendance,
      record.attendanceAndGifts.day4AnAttendance,
      record.attendanceAndGifts.day5FnAttendance,
      record.attendanceAndGifts.day5AnAttendance
    ].filter(Boolean).length;
    
    // Calculate total amount using the formula: (sambavanai * attendanceCount) + travelCharge
    const travelCharge = record.attendanceAndGifts.travelCharge || 0;
    console.log("No of days attended", attendanceCount);
    record.attendanceAndGifts.totalAmount = (value * attendanceCount) + travelCharge;
  }

  onGiftGiven(record: RegistrationResponse, value: boolean): void {
    if (!this.canEdit()) return;

    if(!record.attendanceAndGifts){
      record.attendanceAndGifts = {
        giftGiven: false
      };
    }
    record.attendanceAndGifts.giftGiven = value;
    this.giftGiven = value;
  }

  onDayAttendanceChange(record: RegistrationResponse, value: boolean, day: string, session: string): void {
    if (!this.canEdit()) return;
    
    // Initialize attendanceAndGifts if it doesn't exist
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
        travelCharge: 0,
        sambavanai: 0,
        totalAmount: 0,
        giftGiven: false
      };
    }

    // Update the attendance for the specific day and session
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

    // Calculate total attendance count
    const attendanceCount = [
      record.attendanceAndGifts.day1FnAttendance,
      record.attendanceAndGifts.day1AnAttendance,
      record.attendanceAndGifts.day2FnAttendance,
      record.attendanceAndGifts.day2AnAttendance,
      record.attendanceAndGifts.day3FnAttendance,
      record.attendanceAndGifts.day3AnAttendance,
      record.attendanceAndGifts.day4FnAttendance,
      record.attendanceAndGifts.day4AnAttendance,
      record.attendanceAndGifts.day5FnAttendance,
      record.attendanceAndGifts.day5AnAttendance
    ].filter(Boolean).length;

    // Calculate total amount using the formula: (sambavanai * attendanceCount) + travelCharge
    const sambavanai = record.attendanceAndGifts.sambavanai || 0;
    const travelCharge = record.attendanceAndGifts.travelCharge || 0;
    record.attendanceAndGifts.totalAmount = (sambavanai * attendanceCount) + travelCharge;
  }

  onAccommodationChange(record: RegistrationResponse, value: string) {
    if (record.attendanceAndGifts) {
      record.attendanceAndGifts.accommodation = value;
      // Update the accommodation in the backend
      // this.updateTravelCharges(record);
    }
  }

 updateTravelCharges(record: RegistrationResponse): void {

// Create charges object with numbers
    const charges = {
      travelCharge: record?.attendanceAndGifts?.travelCharge || 0,
      sambavanai: record?.attendanceAndGifts?.sambavanai || 0,
      totalAmount: record?.attendanceAndGifts?.totalAmount || 0,
      accommodation: record?.attendanceAndGifts?.accommodation || 'N/A'
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
this.registrationService.updateCharges(record.registration.id, charges, this.attendanceLog, this.giftGiven).subscribe({
  next: () => {
    alert('Charges updated successfully');
    this.getAttendanceStats();
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
      ${this.formatId(record.registration.id)}
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

  exportAllRecords(): void {
    console.log('Exporting all records...');
    this.isExportingAll = true;
    this.registrationService.exportRegistrationsToExcelAll().subscribe({
      next: () => {
        console.log('All records Excel export successful.');
        this.isExportingAll = false;
      },
      error: (err) => {
        console.error('Error exporting all records Excel:', err);
        // Optionally, show a user-friendly error message
        alert('Failed to export all records: ' + err.message);
        this.isExportingAll = false;
      }
    });
    
  }

  exportToExcel() {
    console.log('Exporting records...');
    this.isExporting = true;
    this.registrationService.exportRegistrationsToExcel().subscribe({
      next: () => {
        console.log('Excel export successful.');
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Error exporting  Excel:', err);
        // Optionally, show a user-friendly error message
        alert('Failed to export records: ' + err.message);
        this.isExporting = false;
      }
    });
   
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

  private formatId(id: number | string): string {
    if (id === null || id === undefined || id === '') return '';
    const stringValue = id.toString();
    const zerosNeeded = Math.max(0, 4 - stringValue.length);
    return '0'.repeat(zerosNeeded) + stringValue;
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
              
              /* Page setup for individual ID cards */
              @page {
                size: 100mm 125mm; /* Target dimension */
                margin: 0;
                padding: 0;
              }
              
               body { 
                margin: 0; 
                padding-left: 0; /* Body itself has no padding */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Styling for each ID card to match printIdCard */
              .id-card { 
                width: 100mm; /* Full page width */
                height: 125mm; /* Full page height */
                box-sizing: border-box;
                border: 1px solid #333;         /* From printIdCard */
                font-family: Arial, sans-serif;  /* From printIdCard */
                display: flex; 
                flex-direction: column; 
                padding-top: 150px; /* Adjusted for general content, original was 150px */
                padding-left: 25px; /* From printIdCard */
                padding-right: 15px; /* Balanced right padding */
                padding-bottom: 15px; /* Balanced bottom padding */
                page-break-after: always; /* Each card on a new page */
                background: white; /* Ensure background for print */
              }
              
              /* Details block styling */
              .details { 
                text-align: left; /* Align text within details to the left */
                margin-bottom: 15px; /* Space between details and QR code */
              }
              
              .detail-row {
                margin: 1px 0; /* Matched from printIdCard inline style */
                display: flex;
                align-items: center;
                width: 100%; /* Takes full available width in the details block */
              }
              
              .label {
                width: 70px;        /* Matched from printIdCard */
                font-size: 15px;    /* From printIdCard */
                color: #555;        /* From printIdCard */
                padding-right: 5px; /* Space between label and value */
              }
              
              .value {
                font-size: 15px;    /* From printIdCard */
                font-weight: bold; /* From printIdCard */
                flex: 1;
              }

              /* QR Code container styling */
              .qr-code-container { 
                text-align: center; /* Center the image */
                margin-top: auto; /* Pushes QR code to the bottom of the flex column */
                padding-top: 10px; /* Mimic spacing from printIdCard */
                align-self: center; /* Center the block itself if not full width */
              }
              
              .qr-code-container img {
                width: 180px; /* Matched from printIdCard */
                height: 180px; /* Matched from printIdCard */
              }
            </style>
      </head>
      <body>
        <!-- Removed the outer .container div, each card is a direct child of body -->
        ${data.map(item => `
            <div class="id-card">
              <div class="details">
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">${item.registration.fullName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">ID No:</span>
                  <span class="value">${this.formatId(item.registration.id)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Vedham:</span>
                  <span class="value">${item.registration.scholarIn || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Sakai:</span>
                  <span class="value">${item.registration.sakai || 'N/A'}</span>
                </div>
                ${item.qrCodeIdentifier ? `
                  <div class="qr-code-container">
                    <img src="${item.qrCodeIdentifier}" alt="QR Code">
                  </div>
                ` : ''}
              </div>
            </div>
        `).join('')}
      </body>
      </html>
    `;

    // Write the content to the new window
    newWindow.document.open();
    newWindow.document.write(pageContent);
    newWindow.document.close();
  }
}
