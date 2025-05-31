import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaskedInputComponent } from './components/masked-input/masked-input.component';

@NgModule({
  declarations: [
    MaskedInputComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    MaskedInputComponent
  ]
})
export class SharedModule { }
