import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registration-closed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="registration-closed-container">
      <div class="registration-closed-content">
        <h1>Registration Closed</h1>
        <p>We're sorry, but registration is currently closed.</p>
        <p>Please check back later or contact the administrator for more information.</p>
      </div>
    </div>
  `,
  styles: [`
    .registration-closed-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    
    .registration-closed-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
    }
    
    h1 {
      color: #d32f2f;
      margin-bottom: 1rem;
    }
    
    p {
      color: #333;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    
    .home-link {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .home-link:hover {
      background-color: #1565c0;
    }
  `]
})
export class RegistrationClosedComponent { }
