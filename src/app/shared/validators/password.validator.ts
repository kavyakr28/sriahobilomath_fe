import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasMinLength = value.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};
    
    if (!hasMinLength) {
      errors['minlength'] = true;
    }
    if (!hasCapitalLetter) {
      errors['noCapital'] = true;
    }
    if (!hasSpecialChar) {
      errors['noSpecialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}

export function getPasswordErrors(control: AbstractControl | null): string[] {
  if (!control?.errors) {
    return [];
  }
  
  const errors = [];
  if (control.errors['required']) {
    errors.push('Password is required');
  }
  if (control.errors['minlength']) {
    errors.push('Must be at least 8 characters long');
  }
  if (control.errors['noCapital']) {
    errors.push('Must contain at least one capital letter');
  }
  if (control.errors['noSpecialChar']) {
    errors.push('Must contain at least one special character');
  }
  if (control.errors['passwordMismatch']) {
    errors.push('Passwords do not match');
  }
  
  return errors;
}
