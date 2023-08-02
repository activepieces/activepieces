import {
  AppConnection,
  AppConnectionType,
  BasicAuthConnection,
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
import {
  BuilderSelectors,
  appConnectionsActions,
} from '@activepieces/ui/feature-builder-store';
import { BasicAuthProperty } from '@activepieces/pieces-framework';
import { AppConnectionsService } from '@activepieces/ui/common';

interface BasicAuthForm {
  name: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
}
export interface BasicAuthDialogData {
  pieceAuthProperty: BasicAuthProperty<boolean>;
  pieceName: string;
  connectionToUpdate?: BasicAuthConnection;
}

@Component({
  selector: 'app-basic-auth-connection-dialog',
  templateUrl: './basic-auth-connection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthConnectionDialogComponent {
  loading = false;
  upsert$: Observable<AppConnection | null>;
  settingsForm: FormGroup<BasicAuthForm>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
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
            Validators.pattern('[A-Za-z0-9_\\-]*'),
          ],
          asyncValidators: [
            ConnectionValidator.createValidator(
              this.store
                .select(BuilderSelectors.selectAllAppConnections)
                .pipe(take(1)),
              undefined
            ),
          ],
        }
      ),
    });
    if (this.dialogData.connectionToUpdate) {
      this.settingsForm.controls.name.setValue(
        this.dialogData.connectionToUpdate.name
      );
      this.settingsForm.controls.name.disable();
      this.settingsForm.controls.username.setValue(
        this.dialogData.connectionToUpdate.value.username
      );
      this.settingsForm.controls.password.setValue(
        this.dialogData.connectionToUpdate.value.password
      );
    }
  }
  submit() {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid) {
      this.loading = true;
      const upsertRequest: UpsertBasicAuthRequest = {
        appName: this.dialogData.pieceName,
        name: this.settingsForm.getRawValue().name,
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
