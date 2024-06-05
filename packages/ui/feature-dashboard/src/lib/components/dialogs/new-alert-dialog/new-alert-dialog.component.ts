import { AlertChannel } from '@activepieces/ee-shared';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, catchError, of, tap } from 'rxjs';
import { AlertsService } from '../../../services/alerts.service';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AuthenticationService,
  GenericSnackbarTemplateComponent,
} from '@activepieces/ui/common';
import { HttpStatusCode } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-alert-dialog',
  templateUrl: './new-alert-dialog.component.html',
})
export class NewAlertDialogComponent {
  newAlertForm: FormGroup<{
    receiver: FormControl<string>;
  }>;
  creatingAlert$: Observable<void>;
  constructor(
    private fb: FormBuilder,
    private alertsService: AlertsService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<NewAlertDialogComponent>
  ) {
    this.newAlertForm = this.fb.group({
      receiver: new FormControl('', { nonNullable: true }),
    });
  }

  addAlert() {
    if (this.newAlertForm.valid) {
      let invalidEmail = false;
      this.creatingAlert$ = this.alertsService
        .add({
          projectId: this.authService.getProjectId(),
          channel: AlertChannel.EMAIL,
          receiver: this.newAlertForm
            .getRawValue()
            .receiver.trim()
            .toLowerCase(),
        })
        .pipe(
          catchError((err) => {
            console.log(err);
            invalidEmail = true;
            if (err.status === HttpStatusCode.Conflict) {
              this.newAlertForm.controls.receiver.setErrors({
                exists: true,
              });
            } else {
              this.snackBar.openFromComponent(
                GenericSnackbarTemplateComponent,
                {
                  data: 'New email added',
                }
              );
            }
            return of(err);
          }),
          tap(() => {
            if (!invalidEmail) {
              this.dialogRef.close();
            }
          })
        );
    }
  }
}
