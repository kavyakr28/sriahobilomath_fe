import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { passwordValidator, getPasswordErrors } from '../../shared/validators';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        passwordValidator()
      ]],
      rememberMe: [false]
    });
  }


  ngOnInit(): void {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Helper method to get password errors for display
  getPasswordErrors(): string[] {
    return getPasswordErrors(this.loginForm.get('password'));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { username, password, rememberMe } = this.loginForm.value;
      
      // Call authentication service
      this.authService.login(username, password).subscribe({
        next: (response: LoginResponse) => {
          console.log("response : "+response);
          this.isLoading = false;
          // Store user data and token
          localStorage.setItem('token', response.token);
          if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(response.user));
          } else {
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }
          this.router.navigate(['/admin/dashboard']);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = 'Invalid username or password. Please try again.';
          console.error('Login error:', error);
        }
      });
    }
  }
}
