import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AttendanceManagementComponent } from './attendance-management.component';

const routes = [
  {
    path: '',
    component: AttendanceManagementComponent
  }
];

@NgModule({
  imports: [
    AttendanceManagementComponent,
    RouterModule.forChild(routes)
  ]
})
export class AttendanceManagementModule { }
