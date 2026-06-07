import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService } from '../services/registration.service';
import { aadhaarCheck } from '../models/aadhaarCheck';

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

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService
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
  // onSubmit() {
  //   // Mark all fields as touched to show validation messages
  //   this.registrationForm.markAllAsTouched();

  //   // Check if form is valid
  //   if (this.registrationForm.invalid) {
  //     return;
  //   }

  //   // Prepare form data
  //   const formValue = { ...this.registrationForm.value };

  //   // Convert date format to yyyy-mm-dd if it exists
  //   if (formValue.dob) {
  //     formValue.dob = this.convertToBackendFormat(formValue.dob);
  //   }

  //   // Handle bank name if 'Others' is selected
  //   if (formValue.bankName === 'Others (Please specify)' && formValue.otherBankName) {
  //     formValue.bankName = formValue.otherBankName;
  //   }

  //   // Remove fields not needed in the backend
  //   delete formValue.confirmAccountNumber;
  //   delete formValue.otherBankName;

  //   // Proceed with form submission
  //   this.isSubmitting = true;
  //   this.registrationService.submitRegistration(formValue).subscribe({
  //     next: (response) => {
  //       this.isSubmitting = false;
  //       this.submitted = true;
  //       alert('Registration successful!!! Please collect your ID Card at Srirangam mutt office on 24-06-2025');
  //       this.registrationForm.reset();
  //     },
  //     error: (error: Error) => {
  //       this.isSubmitting = false;
  //       console.error('Registration failed:', error);
  //       alert('Registration failed. Please try again.');
  //     }
  //   });
  // }


// Update the onSubmit method
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

  // Remove fields not needed in the backend
  delete formValue.confirmAccountNumber;
  delete formValue.otherBankName;

  // Proceed with form submission
  this.isSubmitting = true;
  this.registrationService.submitRegistration(formValue).subscribe({
    next: (response) => {
      this.isSubmitting = false;
      this.submitted = true;
      this.registeredUserData = response;
      this.showSuccessAlert();
      this.registrationForm.reset();
    },
    error: (error: Error) => {
      this.isSubmitting = false;
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  });
}

// Add this new method to show the success alert
private showSuccessAlert(): void {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.style.position = 'fixed';
  alertContainer.style.top = '0';
  alertContainer.style.left = '0';
  alertContainer.style.width = '100%';
  alertContainer.style.height = '100%';
  alertContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  alertContainer.style.display = 'flex';
  alertContainer.style.justifyContent = 'center';
  alertContainer.style.alignItems = 'center';
  alertContainer.style.zIndex = '9999';

  // Create alert box
  const alertBox = document.createElement('div');
  alertBox.style.backgroundColor = 'white';
  alertBox.style.padding = '30px';
  alertBox.style.borderRadius = '10px';
  alertBox.style.textAlign = 'center';
  alertBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  alertBox.style.maxWidth = '500px';
  alertBox.style.width = '90%';

  // Add success icon
  const icon = document.createElement('div');
  icon.innerHTML = '✓';
  icon.style.color = '#4CAF50';
  icon.style.fontSize = '60px';
  icon.style.marginBottom = '20px';
  alertBox.appendChild(icon);

  // Add success message
  const message = document.createElement('h2');
  message.textContent = 'Registration Successful!';
  message.style.color = '#333';
  message.style.marginBottom = '20px';
  alertBox.appendChild(message);

  // Add instruction
  const instruction = document.createElement('p');
  instruction.textContent = 'Please download your registration details and keep it safe.';
  instruction.style.color = '#666';
  instruction.style.marginBottom = '30px';
  alertBox.appendChild(instruction);

  // Add download button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download';
  downloadBtn.style.backgroundColor = '#4CAF50';
  downloadBtn.style.color = 'white';
  downloadBtn.style.border = 'none';
  downloadBtn.style.padding = '12px 30px';
  downloadBtn.style.borderRadius = '5px';
  downloadBtn.style.fontSize = '16px';
  downloadBtn.style.cursor = 'pointer';
  downloadBtn.style.transition = 'background-color 0.3s';
  
  // Hover effect
  downloadBtn.onmouseover = () => {
    downloadBtn.style.backgroundColor = '#45a049';
  };
  downloadBtn.onmouseout = () => {
    downloadBtn.style.backgroundColor = '#4CAF50';
  };

  // Click handler
  downloadBtn.onclick = () => {
    this.downloadIdCard();
    // Close the alert after download
    document.body.removeChild(alertContainer);
  };

  alertBox.appendChild(downloadBtn);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.marginLeft = '15px';
  closeBtn.style.backgroundColor = '#f44336';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '12px 30px';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.transition = 'background-color 0.3s';
  
  // Hover effect
  closeBtn.onmouseover = () => {
    closeBtn.style.backgroundColor = '#d32f2f';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.backgroundColor = '#f44336';
  };

  // Click handler
  closeBtn.onclick = () => {
    document.body.removeChild(alertContainer);
  };

  alertBox.appendChild(closeBtn);

  // Add to DOM
  alertContainer.appendChild(alertBox);
  document.body.appendChild(alertContainer);
}

// Add this method to handle the ID card download
private async downloadIdCard(): Promise<void> {
  if (!this.registeredUserData) {
    alert('Registration data not available. Please try again.');
    return;
  }

  try {
    // Create a temporary div to hold our ID card content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '400px';
    tempDiv.style.padding = '20px';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.border = '1px solid #333';
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    // Create the ID card content
    tempDiv.innerHTML = `      
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #333;">Registration Details</h2>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Name:</div>
        <div>${this.registeredUserData.fullName || 'N/A'}</div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Registration ID:</div>
        <div>${this.registeredUserData.registrationId || 'N/A'}</div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Date of Registration:</div>
        <div>${new Date().toLocaleDateString()}</div>
      </div>
      
      <div style="margin-top: 30px; text-align: center; font-style: italic; color: #666;">
        Please bring this ID when you come to collect your ID card at Srirangam mutt office.
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
    const pdf = new jsPDF('p', 'mm', 'a5'); // 'a5' size for better readability

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
    pdf.save(`Registration_${this.registeredUserData.registrationId || 'details'}.pdf`);

    // Clean up
    document.body.removeChild(tempDiv);

  } catch (err) {
    console.error('Error generating registration details:', err);
    alert('Failed to generate registration details. Please try again or contact support.');
    // Clean up in case of error
    const tempDiv = document.querySelector('div[style*="left: -9999px"]');
    if (tempDiv) {
      document.body.removeChild(tempDiv);
    }
  }
}
}
