import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ManualEntryComponent } from './manual-entry.component';

const routes: Routes = [
  {
    path: '',
    component: ManualEntryComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ManualEntryComponent  // Import the standalone component here
  ]
})
export class ManualEntryModule { }
