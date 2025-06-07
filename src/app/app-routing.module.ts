import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { LoginComponent } from './admin/login/login.component';
import { SignupComponent } from './admin/signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AttendanceManagementComponent } from './admin/attendance-management/attendance-management.component';

const routes: Routes = [
  { path: '', redirectTo: 'registration', pathMatch: 'full' },
  { path: 'registration', component: RegistrationFormComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { 
    path: 'admin/dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/attendance',
    component: AttendanceManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/qr-scanner',
    redirectTo: 'admin/qr-scanner/attendance',
    pathMatch: 'full'
  },
  // Add a catch-all route for 404
  { path: '**', redirectTo: 'registration' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
