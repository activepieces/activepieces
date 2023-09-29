import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, Observable, catchError, tap } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  validateFileControl,
} from '@activepieces/ui/common';
import { ChatBotService } from '../chatbot.service';
import { Chatbot, DataSourceType } from '@activepieces/shared';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export interface AddDataSourceDialogData {
  chatbotId: string;
}

@Component({
  selector: 'app-chatbot-source-dialog',
  templateUrl: './chatbot-source-dialog.component.html',
  styleUrls: [],
})
export class ChatbotDataSourceDialogComponent {
  loading = false;
  createBot$: Observable<Chatbot> | undefined;
  formGroup: FormGroup<{
    file: FormControl<File | null>;
    displayName: FormControl<string>;
  }>;
  serverErrorMessage = '';
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<DeleteEntityDialogComponent>,
    private chatbotService: ChatBotService,
    @Inject(MAT_DIALOG_DATA)
    public data: AddDataSourceDialogData,
    private cd: ChangeDetectorRef
  ) {
    this.formGroup = this.fb.group({
      file: new FormControl<File | null>(null, {
        validators: validateFileControl(['.pdf'], 4000000),
      }),
      displayName: new FormControl<string>('', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });
  }
  confirmClicked() {
    this.serverErrorMessage = '';
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid && !this.loading && this.formGroup.value.file) {
      this.loading = true;
      const fileReader = new FileReader();
      fileReader.readAsDataURL(this.formGroup.value.file);
      fileReader.onload = () => {
        if (typeof fileReader.result === 'string') {
          this.createBot$ = this.chatbotService
            .addDataSource(this.data.chatbotId, {
              displayName: this.formGroup.getRawValue().displayName,
              settings: {
                fileBase64: fileReader.result.split(
                  'data:application/pdf;base64,'
                )[1],
              },
              type: DataSourceType.PDF,
            })
            .pipe(
              tap((res) => {
                this.snackbar.open(`Data source added`);
                this.dialogRef.close(res);
              }),
              catchError((err: HttpErrorResponse) => {
                this.loading = false;
                if (err.status === HttpStatusCode.PaymentRequired) {
                  this.serverErrorMessage =
                    "You can't add anymore datasources with your current plan, please check your plan.";
                } else {
                  this.serverErrorMessage =
                    'Unknown error, please contact support.';
                }
                return EMPTY;
              })
            );
          this.cd.markForCheck();
        }
      };
    }
  }
}
