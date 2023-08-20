import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Observable } from 'rxjs';
import { DeleteEntityDialogComponent } from '@activepieces/ui/common';

@Component({
  selector: 'app-chatbot-source-dialog',
  templateUrl: './chatbot-source-dialog.component.html',
  styleUrls: [],
})
export class ChatbotTypeComponent {
  createBot$: Observable<void> | undefined;
  formGroup: FormGroup<{
    type: FormControl<'URL' | 'PDF'>;
    url: FormControl<string>;
  }>;
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<DeleteEntityDialogComponent>
  ) {
    this.formGroup = this.fb.group({
      type: new FormControl<'URL' | 'PDF'>('URL', { nonNullable: true }),
      url: new FormControl<string>('', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });
  }
  confirmClicked() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      this.dialogRef.close(this.formGroup.value);
      this.snackbar.open(`Data source added`);
    }
  }
}
