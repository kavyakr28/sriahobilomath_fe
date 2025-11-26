import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService } from '../services/registration.service';
import { aadhaarCheck } from '../models/aadhaarCheck';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../shared/alert-dialog/alert-dialog.component';
declare var jsPDF: any;

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss']
})
export class RegistrationFormComponent implements OnInit {
  registrationForm: FormGroup;
  isSubmitting = false;
  submitted = false;
  aadhaarExists = false;
  isCheckingAadhaar = false;
  regResponse:any;
  subCategoryOptions: { value: string; label: string }[] = [];
  
  // Scholar In options
  scholarOptions = [
    { value: 'rig_veda', label: 'Rig Vedam' },
    { value: 'krishna_yajur_veda', label: 'Krishna Yajur Veda' },
    { value: 'shukla_yajur_veda', label: 'Shukla Yajur Veda' },
    { value: 'sama_veda', label: 'Sama Veda' },
    { value: 'atharva_veda', label: 'Atharva Veda' },
    { value: 'granthas', label: 'Granthas' },
    { value: 'prabandam', label: 'Prabandam' }
  ];

  // Sub-category options based on Scholar In selection
  sakaiOptions: { value: string; label: string }[] = [];
  
  // Sub-category mapping
  private subCategoryMap: { [key: string]: { value: string; label: string }[] } = {
    'rig_veda': [
      { value: 'sakala', label: 'Śākala' },
      { value: 'baskala', label: 'Bāṣkala' }
    ],
    'krishna_yajur_veda': [
      { value: 'taittiriya', label: 'Taittirīya Śākhā' },
      { value: 'maitrayaniya', label: 'Maitrāyaṇīya Śākhā' },
      { value: 'kathaka', label: 'Kāṭhaka Śākhā' },
      { value: 'kapishthala_katha', label: 'Kapiṣṭhala-Kaṭha Śākhā' }
    ],
    'shukla_yajur_veda': [
      { value: 'madhyandina', label: 'Mādhyandina Śākhā' },
      { value: 'kanva', label: 'Kāṇva Śākhā' }
    ],
    'sama_veda': [
      { value: 'kauthuma', label: 'Kauthuma Śākhā' },
      { value: 'ranayaniya', label: 'Rāṇāyanīya Śākhā' },
      { value: 'jaiminiya', label: 'Jaiminīya Śākhā' }
    ],
    'atharva_veda': [
      { value: 'shaunaka', label: 'Śaunaka Śākhā' },
      { value: 'paippalada', label: 'Paippalāda' },
      { value: 'devadarsha', label: 'Devadarśa' },
      { value: 'mauda', label: 'Mauda' },
      { value: 'jajala', label: 'Jājala' },
      { value: 'brahmavada', label: 'Brahmavada' },
      { value: 'shaulkayana', label: 'Śaulkāyana' },
      { value: 'naka', label: 'Nāka' },
      { value: 'vedashiras', label: 'Vedaśiras' }
    ],
    'granthas': [
      { value: 'bhagavad_gita', label: 'Bhagavad Gita' },
      { value: 'sri_bashyam', label: 'Sri Bashyam' },
      { value: 'sri_ramayana', label: 'Sri Ramayana' },
      { value: 'others', label: 'Others' }
    ],
    'prabandam': [
      { value: 'poorna_athikari', label: 'Poorna Athikari' },
      { value: 'book_support', label: 'Book support' }
    ]
  };

  accountTypes = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'current', label: 'Current Account' }
  ];

  banks: {name: string, isOther?: boolean}[] = [
    {name: 'Axis Bank'},
    {name: 'Bank of Baroda (BoB)'},
    {name: 'Bank of India'},
    {name: 'Bank of Maharashtra'},
    {name: 'Canara Bank'},
    {name: 'Central Bank of India'},
    {name: 'City Union Bank (CUB)'},
    {name: 'DCB Bank (Development Credit Bank)'},
    {name: 'Federal Bank'},
    {name: 'HDFC Bank'},
    {name: 'ICICI Bank'},
    {name: 'IDFC FIRST Bank'},
    {name: 'Indian Bank'},
    {name: 'Indian Overseas Bank (IOB)'},
    {name: 'IndusInd Bank'},
    {name: 'Karnataka Bank'},
    {name: 'Karur Vysya Bank (KVB)'},
    {name: 'Kotak Mahindra Bank'},
    {name: 'Punjab & Sind Bank'},
    {name: 'Punjab National Bank (PNB)'},
    {name: 'RBL Bank (Ratnakar Bank Limited)'},
    {name: 'South Indian Bank'},
    {name: 'State Bank of India (SBI)'},
    {name: 'Tamilnad Mercantile Bank (TMB)'},
    {name: 'UCO Bank'},
    {name: 'Union Bank of India'},
    {name: 'Yes Bank'},
    {name: 'Others (Please specify)', isOther: true}
  ].sort((a, b) => a.name.localeCompare(b.name));

  // City is now a text input with validation

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private datePipe: DatePipe,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.registrationForm = this.createForm();
    
    // Listen for Aadhaar changes
    this.registrationForm.get('aadhaar')?.valueChanges.subscribe(() => {
      this.aadhaarExists = false;
    });
  }

  ngOnInit(): void {
    // Set up subscription to handle account ownership changes
    this.registrationForm.get('isOwnAccount')?.valueChanges.subscribe(isOwnAccount => {
      const relationshipControl = this.registrationForm.get('accountHolderRelationship');
      const accountHolderNameControl = this.registrationForm.get('accountHolderName');
      
      if (isOwnAccount === false) {
        relationshipControl?.setValidators([Validators.required]);
        accountHolderNameControl?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        relationshipControl?.clearValidators();
        relationshipControl?.setValue('');
        accountHolderNameControl?.clearValidators();
        accountHolderNameControl?.setValue('');
      }
      relationshipControl?.updateValueAndValidity();
      accountHolderNameControl?.updateValueAndValidity();
    });

    // Set up subscription to handle bank selection changes
    this.registrationForm.get('bankName')?.valueChanges.subscribe(bankName => {
      const otherBankNameControl = this.registrationForm.get('otherBankName');
      
      if (bankName === 'Others (Please specify)') {
        otherBankNameControl?.setValidators([Validators.required]);
      } else {
        otherBankNameControl?.clearValidators();
        otherBankNameControl?.setValue('');
      }
      otherBankNameControl?.updateValueAndValidity();
    });

    // Set minimum date to 100 years ago and maximum to 18 years ago
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);
  }

  createForm(): FormGroup {
    const form = this.fb.group({
      // Personal Information
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      dob: ['', [
        Validators.required, 
        Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/),
        this.futureDateValidator()
      ]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: [''],
      city: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z\s-]+$/)
      ]],
      aadhaar: ['', {
        validators: [Validators.required, Validators.pattern('^[0-9]{12}$')],
        asyncValidators: [this.validateAadhaarNotExists.bind(this)],
        updateOn: 'blur'
      }],
      address: ['', [Validators.required, Validators.minLength(10)]],
      sakai: ['', Validators.required],
      emergencyContact: ['', [
        Validators.required, 
        Validators.pattern('^[0-9]{10}$'), 
        this.emergencyContactValidator.bind(this)
      ]],
      scholarIn: ['', Validators.required],
      
      // Banking Information
      isOwnAccount: [true, Validators.required],
      accountHolderRelationship: [''],
      accountHolderName: [''],
      accountNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9,18}$')]],
      confirmAccountNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9,18}$')]],
      ifscCode: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],
      branchName: ['', Validators.required],
      bankName: ['', Validators.required],
      otherBankName: [''],
      accountType: ['', Validators.required]
    }, { 
      validators: [
        this.accountNumberMatcher.bind(this),
        this.accountNumberLengthValidator.bind(this),
        this.emergencyContactValidator.bind(this)
      ]
    });
    
    return form;
  }
  
  // Custom validator to check if account numbers match
  private accountNumberMatcher(control: FormGroup) {
    const accountNumber = control.get('accountNumber');
    const confirmAccountNumber = control.get('confirmAccountNumber');
    
    if (!accountNumber || !confirmAccountNumber) {
      return null;
    }
    
    // Only validate if both fields have values
    if (accountNumber.value && confirmAccountNumber.value) {
      if (accountNumber.value !== confirmAccountNumber.value) {
        confirmAccountNumber.setErrors({ accountNumberMismatch: true });
        return { accountNumberMismatch: true };
      } else if (confirmAccountNumber.errors?.['accountNumberMismatch']) {
        // Clear the mismatch error if the values now match
        delete confirmAccountNumber.errors['accountNumberMismatch'];
        if (Object.keys(confirmAccountNumber.errors).length === 0) {
          confirmAccountNumber.setErrors(null);
        }
      }
    }
    
    return null;
  }

  // Custom validator to ensure account number is between 9-18 digits
  private accountNumberLengthValidator(control: FormGroup) {
    const accountNumber = control.get('accountNumber');
    const confirmAccountNumber = control.get('confirmAccountNumber');
    
    if (accountNumber && accountNumber.value) {
      if (!/^\d{9,18}$/.test(accountNumber.value)) {
        accountNumber.setErrors({ ...(accountNumber.errors || {}), invalidLength: true });
      } else if (accountNumber.errors?.['invalidLength']) {
        delete accountNumber.errors['invalidLength'];
        if (Object.keys(accountNumber.errors).length === 0) {
          accountNumber.setErrors(null);
        }
      }
    }
    
    if (confirmAccountNumber && confirmAccountNumber.value) {
      if (!/^\d{9,18}$/.test(confirmAccountNumber.value)) {
        confirmAccountNumber.setErrors({ ...(confirmAccountNumber.errors || {}), invalidLength: true });
      } else if (confirmAccountNumber.errors?.['invalidLength']) {
        delete confirmAccountNumber.errors['invalidLength'];
        if (Object.keys(confirmAccountNumber.errors).length === 0) {
          confirmAccountNumber.setErrors(null);
        }
      }
    }
    
    return null;
  }

  // Custom validator to check if emergency contact is different from phone number
  private emergencyContactValidator(group: FormGroup) {
    const phone = group.get('phone');
    const emergencyContact = group.get('emergencyContact');

    if (!phone || !emergencyContact) {
      return null;
    }

    const phoneValue = phone.value;
    const emergencyContactValue = emergencyContact.value;

    if (phoneValue && emergencyContactValue && phoneValue === emergencyContactValue) {
      emergencyContact.setErrors({ ...emergencyContact.errors, sameAsPhone: true });
      return { sameAsPhone: true };
    } else if (emergencyContact.errors?.['sameAsPhone']) {
      // Clear the error if it was previously set
      const errors = { ...emergencyContact.errors };
      delete errors['sameAsPhone'];
      emergencyContact.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    return null;
  }

  onScholarInChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    this.registrationForm.get('scholarSubCategory')?.reset();
    this.subCategoryOptions = this.subCategoryMap[selectedValue] || [];
  }

  // Helper to check if a field should show validation errors
  showErrors(controlName: string) {
    const control = this.registrationForm.get(controlName);
    return control && (control.touched || this.submitted) && control.errors;
  }

  // Helper to get the actual account number value for comparison
  getAccountNumberValue(controlName: string): string {
    const control = this.registrationForm.get(controlName);
    return control ? control.value : '';
  }

  // Check if Aadhaar exists
  validateAadhaarNotExists(control: any): Promise<any> {
    console.log('Validating Aadhaar:', control.value);
    const aadhaar = control.value;
    if (!aadhaar || aadhaar.length !== 12) {
      control.setErrors(null);
      return Promise.resolve(null);
    }

    this.isCheckingAadhaar = true;
    
    return new Promise((resolve) => {
      this.registrationService.checkAadhaar(aadhaar).subscribe({
        next: (response: aadhaarCheck) => {
          this.isCheckingAadhaar = false;
          // Check if response is an object with aadhaarNumberAvailable property
          const isAvailable = typeof response === 'boolean' ? response : response?.aadhaarNumberAvailable;
          
          if (isAvailable === true) {
            control.setErrors({ aadhaarExists: true });
            resolve({ aadhaarExists: true });
          } else if (isAvailable === false) {
            control.setErrors(null);
            resolve(null);
          } else {
            control.setErrors(null);
            resolve(null);
          }
        },
        error: (error) => {
          console.error('Error checking Aadhaar:', error);
          this.isCheckingAadhaar = false;
          control.setErrors(null);
          resolve(null);
        }
      });
    });
  }

  // Helper to easily access form controls in the template
  get f() { 
    return this.registrationForm.controls; 
  }

  // Format date input with automatic slashes
  formatDateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d/]/g, ''); // Keep only digits and slashes
    
    // Add slashes after day and month
    if (value.length > 2 && !value.includes('/')) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length > 5 && value.split('/').length < 3) {
      value = value.substring(0, 5) + '/' + value.substring(5);
    }
    
    // Limit to 10 characters (dd/mm/yyyy)
    value = value.substring(0, 10);
    
    // Update the input value
    input.value = value;
    // Update the form control value
    this.registrationForm.get('dob')?.setValue(value, { emitEvent: false });
  }

  // Convert dd/mm/yyyy to yyyy-mm-dd format for backend
  private convertToBackendFormat(dateStr: string): string {
    if (!dateStr) return '';
    
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Validator to prevent future dates
  private futureDateValidator() {
    return (control: any) => {
      if (!control.value) return null;
      
      const [day, month, year] = control.value.split('/').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return inputDate > today ? { futureDate: true } : null;
    };
  }

  // Handle form submission with proper validation and data processing
  downloadIdCard(userData: any) {
    // Create a new PDF document in A6 size (half of A5)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [105, 148] // A6 size in landscape
    });

    // Add background color
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    // Add outer border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(5, 5, 95, 58, 3, 3, 'S');

    // Add header with orange background
    doc.setFillColor(255, 165, 0); // Orange color
    doc.roundedRect(5, 5, 95, 10, 3, 3, 'F');
    
    // Add header text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SRI RANGANATHA TEMPLE', 52.5, 11, { align: 'center' });
    
    // Add subheader
    doc.setFontSize(8);
    doc.text('Srirangam, Tiruchirappalli - 620 006', 52.5, 14.5, { align: 'center' });
    
    // Add ID Card title
    doc.setFontSize(10);
    doc.text('IDENTITY CARD', 52.5, 19, { align: 'center' });
    
    // Add photo placeholder
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(10, 22, 25, 30, 'S');
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Paste Passport', 22.5, 32, { align: 'center' });
    doc.text('Size Photo', 22.5, 35, { align: 'center' });
    doc.text('(3.5cm x 4.5cm)', 22.5, 40, { align: 'center' });
    
    // Add user details
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    // ID
    doc.setFont('helvetica', 'bold');
    doc.text('ID:', 40, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.id.toString(), 50, 25);
    
    // Name
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 40, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.fullName || '', 50, 30);
    
    // DOB
    doc.setFont('helvetica', 'bold');
    doc.text('DOB:', 40, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.dob || '', 50, 35);
    
    // Aadhaar
    doc.setFont('helvetica', 'bold');
    doc.text('Aadhaar No:', 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.aadhaar || '', 55, 40);
    
    // Phone
    doc.setFont('helvetica', 'bold');
    doc.text('Phone No:', 40, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.phone || '', 55, 45);
    
    // Veda/Sakha
    doc.setFont('helvetica', 'bold');
    doc.text('Veda/Sakha:', 40, 50);
    doc.setFont('helvetica', 'normal');
    
    // Find the display names for scholarIn and sakai
    const scholarOption = this.scholarOptions.find(opt => opt.value === userData.scholarIn);
    const sakaiOption = this.sakaiOptions.find(opt => opt.value === userData.sakai);
    
    const scholarText = scholarOption ? scholarOption.label : userData.scholarIn || '';
    const sakaiText = sakaiOption ? sakaiOption.label : userData.sakai || '';
    
    doc.text(`${scholarText} - ${sakaiText}`, 55, 50);
    
    // Add signature placeholder
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(10, 54, 35, 54);
    doc.setFontSize(6);
    doc.text('Signature', 22.5, 57, { align: 'center' });
    
    // Add footer
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text('This ID card is valid only for the event period', 52.5, 62, { align: 'center' });
    
    // Add date of issue
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB');
    doc.text(`Date of Issue: ${formattedDate}`, 15, 62);
    
    // Add valid until date (6 months from now)
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 6);
    const formattedValidUntil = validUntil.toLocaleDateString('en-GB');
    doc.text(`Valid Until: ${formattedValidUntil}`, 65, 62);
    
    // Add a small note
    doc.setFontSize(5);
    doc.setTextColor(100, 100, 100);
    doc.text('Please carry this ID card at all times during the event', 52.5, 65, { align: 'center' });
    
    // Add a small border at the bottom
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(10, 66, 95, 66);
    
    // Add emergency contact
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('In case of emergency, please contact:', 52.5, 70, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${userData.emergencyContact || 'N/A'}`, 52.5, 73, { align: 'center' });
    
    // Add a small QR code placeholder (just a box for now)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(75, 25, 20, 20, 'S');
    doc.setFontSize(4);
    doc.text('QR Code', 85, 38, { align: 'center' });
    doc.text('(Will be scanned at venue)', 85, 41, { align: 'center' });
    
    // Save the PDF
    doc.save(`ID_Card_${userData.id}.pdf`);
  }

  async onSubmit() {
    // Mark all fields as touched to show validation messages
    this.registrationForm.markAllAsTouched();
    
    // Check if form is valid and log any validation errors
    if (this.registrationForm.invalid) {
      console.log('Form is invalid. Validation errors:');
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        if (control && control.errors) {
          console.log(`Field: ${key}`, {
            status: control.status,
            errors: control.errors,
            value: control.value,
            touched: control.touched,
            dirty: control.dirty
          });
        }
      });
      return;
    }

    // Prepare form data
    const formValue = { ...this.registrationForm.value };
    
    // Convert date format to yyyy-mm-dd if it exists
    if (formValue.dob) {
      formValue.dob = this.convertToBackendFormat(formValue.dob);
    }

    // Handle bank name if 'Others' is selected
    if (formValue.bankName === 'Others (Please specify)' && formValue.otherBankName) {
      formValue.bankName = formValue.otherBankName;
    }

    // Remove fields not needed in the backend
    delete formValue.confirmAccountNumber;
    delete formValue.otherBankName;

    // Proceed with form submission
    this.isSubmitting = true;
    this.registrationService.submitRegistration(formValue).subscribe({
      next: async (response) => {
        console.log("Registration successful with ID:", response.id);
        this.isSubmitting = false;
        this.submitted = true;
        this.regResponse = response;
        this.dialog.open(AlertDialogComponent, {
          width: '400px',
          disableClose: true,
          panelClass: 'custom-dialog-container'
        });

        this.registrationForm.reset();

        console.log("Generating ID card for:", this.regResponse.id);
        
        try {
          const blob = await this.registrationService.getQRImage(this.regResponse.id).toPromise();
          const qrCodeUrl = URL.createObjectURL(blob);
          
          // Create a temporary div to hold our ID card content
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '400px';
          tempDiv.style.height = '500px';
          tempDiv.style.padding = '20px';
          tempDiv.style.boxSizing = 'border-box';
          tempDiv.style.fontFamily = 'Arial, sans-serif';
          tempDiv.style.border = '1px solid #333';
          tempDiv.style.display = 'flex';
          tempDiv.style.flexDirection = 'column';
          tempDiv.style.alignItems = 'center';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);
      
          // Create the ID card content
          tempDiv.innerHTML = `      
            <div style="display: flex; margin: 10px 0; width: 100%;">
              <div style="width: 100px; font-size: 16px; color: #555;">Name:</div>
              <div style="font-size: 16px; font-weight: bold; flex: 1;">
                ${this.regResponse.fullName}
              </div>
            </div>
            
            <div style="display: flex; margin: 10px 0; width: 100%;">
              <div style="width: 100px; font-size: 16px; color: #555;">ID No:</div>
              <div style="font-size: 16px; font-weight: bold; flex: 1;">
                ${this.formatId(this.regResponse.id)}
              </div>
            </div>
            
            <div style="display: flex; margin: 10px 0; width: 100%;">
              <div style="width: 100px; font-size: 16px; color: #555;">Vedham:</div>
              <div style="font-size: 16px; font-weight: bold; flex: 1;">
                ${this.regResponse.scholarIn || 'N/A'}
              </div>
            </div>
            
            <div style="display: flex; margin: 10px 0 20px 0; width: 100%;">
              <div style="width: 100px; font-size: 16px; color: #555;">Shakai:</div>
              <div style="font-size: 16px; font-weight: bold; flex: 1;">
                ${this.regResponse.sakai || 'N/A'}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;">
            </div>
          `;
      
          // Import required libraries
          const [html2canvas, { jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf')
          ]);
      
          // Convert the div to a canvas
          const canvas = await html2canvas.default(tempDiv, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
      
          // Create a new PDF document
          const pdf = new jsPDF('p', 'mm', 'a6'); // 'a6' is a good size for ID cards
          
          // Calculate dimensions to center the content
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = pdfWidth * 0.9; // 90% of page width
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;
      
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          
          // Save the PDF
          pdf.save(`ID_Card_${this.regResponse.id}.pdf`);
          
          // Clean up
          document.body.removeChild(tempDiv);
          URL.revokeObjectURL(qrCodeUrl);
          
        } catch (err) {
          console.error('Error generating ID card:', err);
          // Clean up in case of error
          const tempDiv = document.querySelector('div[style*="left: -9999px"]');
          if (tempDiv) {
            document.body.removeChild(tempDiv);
          }
        }
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        console.error('Registration failed:', error);
        alert('Registration failed. Please try again.');
      }
    });
      }
      private formatId(id: number | string): string {
    if (id === null || id === undefined || id === '') return '';
    const stringValue = id.toString();
    const zerosNeeded = Math.max(0, 4 - stringValue.length);
    return '0'.repeat(zerosNeeded) + stringValue;
  }
    }
  

   
