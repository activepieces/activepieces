import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ai-feedback-dialog',
  templateUrl: './ai-feedback-dialog.component.html',
})
export class AiFeedbackDialogComponent {
  feedbackFormControl = new FormControl('');
  constructor(
    private dialogRef: MatDialogRef<AiFeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { like: true }
  ) {}
  submit() {
    this.dialogRef.close(this.feedbackFormControl.value);
  }
}
