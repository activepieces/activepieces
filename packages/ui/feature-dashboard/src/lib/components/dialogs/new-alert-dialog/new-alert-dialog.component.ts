import { AlertChannel } from '@activepieces/ee-shared';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { AlertsService } from '../../../services/alerts.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '@activepieces/ui/common';

@Component({
  selector: 'app-new-alert-dialog',
  templateUrl: './new-alert-dialog.component.html',
})
export class NewAlertDialogComponent {
  newAlertForm: FormGroup<{
    channel: FormControl<string>;
    details: FormControl<string>;
  }>;
  creatingAlert$: Observable<void>;
  constructor(
    private fb: FormBuilder,
    private alertsService: AlertsService,
    private authService: AuthenticationService,
    public dialogRef: MatDialogRef<NewAlertDialogComponent>
  ) {
    this.newAlertForm = this.fb.group({
      channel: new FormControl('', { nonNullable: true }),
      details: new FormControl('', { nonNullable: true }),
    });
  }

  addAlert() {
    if (this.newAlertForm.valid) {
      this.creatingAlert$ = this.alertsService
        .add({
          projectId: this.authService.getProjectId(),
          channel: AlertChannel.EMAIL,
          details: this.newAlertForm.getRawValue().details.trim(),
        })
        .pipe(
          tap(() => {
            this.dialogRef.close();
          })
        );
    }
  }
}
