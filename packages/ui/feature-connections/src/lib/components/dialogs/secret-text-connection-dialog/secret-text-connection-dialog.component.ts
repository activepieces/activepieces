import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  ErrorCode,
} from '@activepieces/shared';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  AppConnectionsService,
  AuthenticationService,
  DiagnosticDialogComponent,
} from '@activepieces/ui/common';
import { createConnectionNameControl } from '../utils';

interface SecretTextForm {
  secretText: FormControl<string>;
  name: FormControl<string>;
}
export interface SecretTextConnectionDialogData {
  pieceName: string;
  connectionName?: string;
  displayName: string;
  description: string;
  pieceDisplayName: string;
}

@Component({
  selector: 'app-secret-text-connection-dialog',
  templateUrl: './secret-text-connection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretTextConnectionDialogComponent {
  settingsForm: FormGroup<SecretTextForm>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  loading = false;
  upsert$: Observable<AppConnectionWithoutSensitiveData | null>;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public dialogData: SecretTextConnectionDialogData,
    private fb: FormBuilder,
    private dialogService: MatDialog,
    private authenticatiionService: AuthenticationService,
    private appConnectionsService: AppConnectionsService,
    public dialogRef: MatDialogRef<SecretTextConnectionDialogComponent>
  ) {
    this.settingsForm = this.fb.group({
      secretText: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: createConnectionNameControl({
        appConnectionsService: this.appConnectionsService,
        pieceName: this.dialogData.pieceName,
        existingConnectionName: this.dialogData.connectionName,
      }),
    });
  }
  submit() {
    this.settingsForm.markAllAsTouched();
    if (!this.loading && this.settingsForm.valid) {
      this.loading = true;
      this.upsert$ = this.appConnectionsService
        .upsert({
          projectId: this.authenticatiionService.getProjectId(),
          pieceName: this.dialogData.pieceName,
          name: this.settingsForm.controls.name.value,
          type: AppConnectionType.SECRET_TEXT,
          value: {
            secret_text: this.settingsForm.controls.secretText.value,
            type: AppConnectionType.SECRET_TEXT,
          },
        })
        .pipe(
          catchError((response) => {
            console.error(response);
            const hasMessage =
              response.error?.code === ErrorCode.INVALID_APP_CONNECTION;
            if (hasMessage) {
              this.settingsForm.setErrors({
                message: `Connection failed: ${response.error.params.error}`,
              });
            } else {
              this.settingsForm.setErrors({
                diagnostic: response.error.params,
              });
            }
            return of(null);
          }),
          tap((connection) => {
            if (connection) {
              this.dialogRef.close(connection);
            }
            this.loading = false;
          })
        );
    }
  }

  openDiagnosticDialog(information: unknown) {
    this.dialogService.open(DiagnosticDialogComponent, {
      data: {
        information,
      },
    });
  }
}
