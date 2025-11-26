import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title style="text-align: center; color: #1976d2;">Important Instruction</h2>
    <mat-dialog-content style="text-align: center; font-size: 16px; padding: 20px 24px; color: #d32f2f;">
      <p>Your ID Card PDF will be downloaded automatically, please check your downloads folder.</p>
      <p>(Please click on "Allow" if your browser asks for download permission)</p>
      <p>Remember to bring this downloaded file when you come for the Parayanam.</p>
      
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-raised-button color="primary" (click)="onClose()">I Understand</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0;
      margin: 0;
    }
    .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 8px !important;
    }
  `]
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
