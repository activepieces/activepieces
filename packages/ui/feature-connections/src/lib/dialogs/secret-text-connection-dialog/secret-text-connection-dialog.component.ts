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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, take, tap } from 'rxjs';
import { ConnectionValidator } from '../../validators/connectionNameValidator';

import {
  AppConnectionsService,
  AuthenticationService,
} from '@activepieces/ui/common';
import { connectionNameRegex } from '../utils';
import {
  appConnectionsActions,
  appConnectionsSelectors,
} from '@activepieces/ui/common-store';

interface SecretTextForm {
  secretText: FormControl<string>;
  name: FormControl<string>;
}
export interface SecretTextConnectionDialogData {
  pieceName: string;
  connectionName?: string;
  displayName: string;
  description: string;
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
    private store: Store,
    private authenticatiionService: AuthenticationService,
    private appConnectionsService: AppConnectionsService,
    public dialogRef: MatDialogRef<SecretTextConnectionDialogComponent>
  ) {
    this.settingsForm = this.fb.group({
      secretText: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: new FormControl(
        appConnectionsService.getConnectionNameSuggest(
          this.dialogData.pieceName
        ),
        {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.pattern(connectionNameRegex),
          ],
          asyncValidators: [
            ConnectionValidator.createValidator(
              this.store
                .select(appConnectionsSelectors.selectAllAppConnections)
                .pipe(take(1)),
              undefined
            ),
          ],
        }
      ),
    });
    if (this.dialogData.connectionName) {
      this.settingsForm.controls.name.disable();
    }
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
            this.settingsForm.setErrors({
              message:
                response.error.code === ErrorCode.INVALID_APP_CONNECTION
                  ? `Connection failed: ${response.error.params.error}`
                  : 'Internal Connection error, failed please check your console.',
            });
            return of(null);
          }),
          tap((connection) => {
            if (connection) {
              this.store.dispatch(
                appConnectionsActions.upsert({ connection: connection })
              );
              this.dialogRef.close(connection);
            }
            this.loading = false;
          })
        );
    }
  }
}
