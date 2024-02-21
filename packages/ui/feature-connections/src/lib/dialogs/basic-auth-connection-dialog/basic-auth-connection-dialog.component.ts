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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, take, tap } from 'rxjs';
import { ConnectionValidator } from '../../validators/connectionNameValidator';
import { BasicAuthProperty } from '@activepieces/pieces-framework';
import {
  AppConnectionsService,
  AuthenticationService,
  appConnectionsSelectors,
  appConnectionsActions,
} from '@activepieces/ui/common';
import { connectionNameRegex } from '../utils';

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
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private authenticationService: AuthenticationService,
    private appConnectionsService: AppConnectionsService,
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
    if (this.dialogData.connectionToUpdate) {
      this.settingsForm.controls.name.disable();
    }
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
