import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  ErrorCode,
  UpsertBasicAuthRequest,
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
import { BasicAuthProperty } from '@activepieces/pieces-framework';
import {
  AppConnectionsService,
  AuthenticationService,
  DiagnosticDialogComponent,
} from '@activepieces/ui/common';
import { createConnectionNameControl } from '../utils';

interface BasicAuthForm {
  name: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
}
export interface BasicAuthDialogData {
  pieceAuthProperty: BasicAuthProperty;
  pieceName: string;
  pieceDisplayName: string;
  connectionToUpdate?: AppConnectionWithoutSensitiveData;
}

@Component({
  selector: 'app-basic-auth-connection-dialog',
  templateUrl: './basic-auth-connection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthConnectionDialogComponent {
  loading = false;
  upsert$: Observable<AppConnectionWithoutSensitiveData | null>;
  settingsForm: FormGroup<BasicAuthForm>;
  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private appConnectionsService: AppConnectionsService,
    private dialogService: MatDialog,
    private dialogRef: MatDialogRef<BasicAuthConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly dialogData: BasicAuthDialogData
  ) {
    this.settingsForm = this.formBuilder.group({
      username: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: createConnectionNameControl({
        appConnectionsService: this.appConnectionsService,
        pieceName: this.dialogData.pieceName,
        existingConnectionName: this.dialogData.connectionToUpdate?.name,
      }),
    });
  }
  submit() {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid) {
      this.loading = true;
      const upsertRequest: UpsertBasicAuthRequest = {
        pieceName: this.dialogData.pieceName,
        projectId: this.authenticationService.getProjectId(),
        name: this.settingsForm.getRawValue().name,
        type: AppConnectionType.BASIC_AUTH,
        value: {
          password: this.settingsForm.getRawValue().password,
          username: this.settingsForm.getRawValue().username,
          type: AppConnectionType.BASIC_AUTH,
        },
      };
      this.upsert$ = this.appConnectionsService.upsert(upsertRequest).pipe(
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
