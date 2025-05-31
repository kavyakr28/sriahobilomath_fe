import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SignupRequest } from '../../services/auth.service';
import { passwordValidator, passwordMatchValidator, getPasswordErrors } from '../../shared/validators';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;  
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-Z0-9._-]+$')
      ]],
      password: ['', [
        Validators.required,
        passwordValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator('password', 'confirmPassword') });
  }

  ngOnInit(): void {}

  // Use the shared password match validator from validators.ts

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { name, username, password } = this.signupForm.value;
      const userData: SignupRequest = { 
        name: name.trim(), 
        username: username.trim().toLowerCase(),
        password, 
        confirmPassword: password 
      };
      
      this.authService.signup(userData).subscribe({
        next: () => {
          // Navigation is handled in the AuthService after successful signup
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.isLoading = false;
          this.errorMessage = error.message;
          
          // Handle duplicate username error specifically
            if (error.message.includes('already exists')) {
            this.signupForm.get('username')?.setErrors({ duplicate: true });
          }
          
          console.error('Signup error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
    }
  }

  // Helper method to get password errors for display
  getPasswordErrors(controlName: string): string[] {
    return getPasswordErrors(this.signupForm.get(controlName));
  }
}
