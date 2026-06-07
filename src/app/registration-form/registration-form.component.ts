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
  regResponse: any;
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

  banks: { name: string, isOther?: boolean }[] = [
    { name: 'Axis Bank' },
    { name: 'Bank of Baroda (BoB)' },
    { name: 'Bank of India' },
    { name: 'Bank of Maharashtra' },
    { name: 'Canara Bank' },
    { name: 'Central Bank of India' },
    { name: 'City Union Bank (CUB)' },
    { name: 'DCB Bank (Development Credit Bank)' },
    { name: 'Federal Bank' },
    { name: 'HDFC Bank' },
    { name: 'ICICI Bank' },
    { name: 'IDFC FIRST Bank' },
    { name: 'Indian Bank' },
    { name: 'Indian Overseas Bank (IOB)' },
    { name: 'IndusInd Bank' },
    { name: 'Karnataka Bank' },
    { name: 'Karur Vysya Bank (KVB)' },
    { name: 'Kotak Mahindra Bank' },
    { name: 'Punjab & Sind Bank' },
    { name: 'Punjab National Bank (PNB)' },
    { name: 'RBL Bank (Ratnakar Bank Limited)' },
    { name: 'South Indian Bank' },
    { name: 'State Bank of India (SBI)' },
    { name: 'Tamilnad Mercantile Bank (TMB)' },
    { name: 'UCO Bank' },
    { name: 'Union Bank of India' },
    { name: 'Yes Bank' },
    { name: 'Others (Please specify)', isOther: true }
  ].sort((a, b) => a.name.localeCompare(b.name));

  // City is now a text input with validation


  // Add this property at the top of your component class
  registeredUserData: any = null;
  passbookImageBase64?: string;
  passbookImageContentType?: string;

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
      accountType: ['', Validators.required],
      passbookImage: [null, Validators.required]
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

  // Handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        this.registrationForm.get('passbookImage')?.setErrors({ invalidFileType: true });
        this.registrationForm.get('passbookImage')?.setValue(null);
        return;
      }
      
      // Validate file size (e.g. max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        this.registrationForm.get('passbookImage')?.setErrors({ fileSizeExceeded: true });
        this.registrationForm.get('passbookImage')?.setValue(null);
        return;
      }

      this.registrationForm.get('passbookImage')?.setValue(file);
      this.passbookImageContentType = file.type;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // The result is in format: data:image/png;base64,iVBORw0KGgo...
        // We just need the base64 part
        this.passbookImageBase64 = result.split(',')[1];
      };
      reader.readAsDataURL(file);
    } else {
      this.registrationForm.get('passbookImage')?.setValue(null);
      this.passbookImageBase64 = undefined;
      this.passbookImageContentType = undefined;
    }
  }

  // Handle form submission with proper validation and data processing
  onSubmit() {
    // Mark all fields as touched to show validation messages
    this.registrationForm.markAllAsTouched();

    // Check if form is valid
    if (this.registrationForm.invalid) {
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

    // Attach image data if available
    if (this.passbookImageBase64) {
      formValue.passbookImageBase64 = this.passbookImageBase64;
      formValue.passbookImageContentType = this.passbookImageContentType;
    }

    // Remove fields not needed in the backend
    delete formValue.confirmAccountNumber;
    delete formValue.otherBankName;
    delete formValue.passbookImage; // Remove the File object from the payload

    // Proceed with form submission
    this.isSubmitting = true;
    this.registrationService.submitRegistration(formValue).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitted = true;
        alert('Registration successful!!! Please collect your ID Card at Srirangam mutt office on 24-06-2025');
        this.registrationForm.reset();
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        console.error('Registration failed:', error);
        alert('Registration failed. Please try again.');
      }
    });
  }
}
