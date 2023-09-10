import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Observable, tap } from 'rxjs';
import { DeleteEntityDialogComponent } from '@activepieces/ui/common';
import { DatasourceType } from '../utils';
import { ChatBotService } from '../chatbot.service';
import { DataSource } from '@activepieces/shared';

export interface AddDataSourceDialogData {
  chatbotId: string;
  auth: string;
}

@Component({
  selector: 'app-chatbot-source-dialog',
  templateUrl: './chatbot-source-dialog.component.html',
  styleUrls: [],
})
export class ChatbotDataSourceDialogComponent {
  createBot$: Observable<DataSource> | undefined;
  formGroup: FormGroup<{
    type: FormControl<DatasourceType>;
    url: FormControl<string>;
    displayName: FormControl<string>;
  }>;
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<DeleteEntityDialogComponent>,
    private chatbotService: ChatBotService,
    @Inject(MAT_DIALOG_DATA)
    public data: AddDataSourceDialogData
  ) {
    this.formGroup = this.fb.group({
      type: new FormControl<DatasourceType>('from-file', { nonNullable: true }),
      url: new FormControl<string>('', {
        validators: Validators.required,
        nonNullable: true,
      }),
      displayName: new FormControl<string>('', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });
  }
  confirmClicked() {
    this.formGroup.markAllAsTouched();
    this.createBot$ = this.chatbotService
      .addDataSource(this.data.chatbotId, {
        displayName: this.formGroup.getRawValue().displayName,
        pieceName: 'pdf',
        props: {
          url: this.formGroup.getRawValue().url,
        },
        sourceName: this.formGroup.getRawValue().type,
        auth: this.data.auth,
      })
      .pipe(
        tap((res) => {
          this.dialogRef.close(res);
        })
      );
    if (this.formGroup.valid) {
      this.snackbar.open(`Data source added`);
    }
  }
}
