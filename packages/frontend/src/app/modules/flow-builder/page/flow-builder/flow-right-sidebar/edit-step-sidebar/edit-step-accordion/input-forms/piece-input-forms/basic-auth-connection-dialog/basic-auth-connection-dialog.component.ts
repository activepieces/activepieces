import { AppConnection, AppConnectionType, BasicAuthConnection, UpsertBasicAuthRequest } from '@activepieces/shared';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { PieceConfig } from 'packages/frontend/src/app/modules/common/components/configs-form/connector-action-or-config';
import { AppConnectionsService } from 'packages/frontend/src/app/modules/common/service/app-connections.service';
import { appConnectionsActions } from 'packages/frontend/src/app/modules/flow-builder/store/app-connections/app-connections.action';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';
import { catchError, Observable, of, take, tap } from 'rxjs';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';

interface BasicAuthForm {
  name: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
}
export interface BasicAuthDialogData {
  pieceAuthConfig: PieceConfig;
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
  constructor(private formBuilder: FormBuilder, private store: Store,
    private appConnectionsService: AppConnectionsService,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<BasicAuthConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly dialogData: BasicAuthDialogData) {
    this.settingsForm = this.formBuilder.group({
      username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl(
        this.dialogData.pieceName.replace(/[^A-Za-z0-9_]/g, '_'), {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
        asyncValidators: [
          ConnectionValidator.createValidator(
            this.store
              .select(BuilderSelectors.selectAllAppConnections)
              .pipe(take(1)),
            undefined
          )]
      })
    }
    )
    if (this.dialogData.connectionToUpdate) {
      this.settingsForm.controls.name.setValue(this.dialogData.connectionToUpdate.name);
      this.settingsForm.controls.name.disable();
      this.settingsForm.controls.username.setValue(this.dialogData.connectionToUpdate.value.username);
      this.settingsForm.controls.password.setValue(this.dialogData.connectionToUpdate.value.password);
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
          type: AppConnectionType.BASIC_AUTH
        }

      }
      this.upsert$ = this.appConnectionsService.upsert(upsertRequest).pipe(catchError((err) => {
        console.error(err);
        this.snackbar.open(
          'Connection operation failed please check your console.',
          'Close',
          {
            panelClass: 'error',
            duration: 5000,
          }
        );
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
