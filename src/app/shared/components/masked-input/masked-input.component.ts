import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, FormControl } from '@angular/forms';

@Component({
  selector: 'app-masked-input',
  template: `
    <div class="form-group">
      <label *ngIf="label">{{ label }} <span *ngIf="required" class="required">*</span></label>
      <input
        [type]="showActualValue ? 'text' : 'password'"
        [value]="value"
        [placeholder]="placeholder"
        [required]="required"
        [attr.aria-label]="label"
        [class.error]="showError"
        (input)="onInput($event)"
        maxlength="18"
        (blur)="onTouched()"
      >
      <div *ngIf="showError" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-group { margin-bottom: 1rem; }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
      font-size: 1rem;
    }
    input.error { border-color: #dc3545; }
    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .required { color: #dc3545; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MaskedInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MaskedInputComponent),
      multi: true
    }
  ]
})
export class MaskedInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() showActualValue = false; // New input to control whether to show actual value or mask it
  
  value = '';
  showError = false;
  errorMessage = '';
  
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  // Handle input events
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Filter out non-digit characters
    const newValue = input.value.replace(/\D/g, '');
    if (newValue !== this.value) {
      this.value = newValue;
      this.onChange(this.value);
    }
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = (value !== undefined && value !== null) ? value.toString() : '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Implement if needed
  }

  // Helper method to set error state
  setError(message: string): void {
    this.showError = !!message;
    this.errorMessage = message;
  }
  
  // Validation
  validate(control: FormControl) {
    if (this.required && !control.value) {
      return { required: true };
    }
    return null;
  }
}
