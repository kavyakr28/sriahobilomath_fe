import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AttendanceManagementComponent } from './attendance-management.component';

@NgModule({
  declarations: [
    AttendanceManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: AttendanceManagementComponent }
    ])
  ],
  exports: [
    AttendanceManagementComponent
  ]
})
export class AttendanceManagementModule { }
