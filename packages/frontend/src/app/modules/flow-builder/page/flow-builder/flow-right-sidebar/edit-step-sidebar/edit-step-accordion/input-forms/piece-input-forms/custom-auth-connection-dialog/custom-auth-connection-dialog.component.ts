import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, take, tap } from 'rxjs';
import {
  AppConnection,
  AppConnectionType,
  CustomAuthConnection,
  PropertyType,
  UpsertCustomAuthRequest,
} from '@activepieces/shared';
import { PieceConfig } from '../../../../../../../../../common/components/configs-form/connector-action-or-config';
import { BuilderSelectors } from '../../../../../../../../store/builder/builder.selector';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';
import deepEqual from 'deep-equal';
import { appConnectionsActions } from '../../../../../../../../store/app-connections/app-connections.action';
import { AppConnectionsService } from '../../../../../../../../../common/service/app-connections.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface CustomAuthDialogData {
  pieceAuthConfig: PieceConfig;
  pieceName: string;
  connectionToUpdate?: CustomAuthConnection;
}

@Component({
  selector: 'app-custom-auth-connection-dialog',
  templateUrl: './custom-auth-connection-dialog.component.html',
})
export class CustomAuthConnectionDialogComponent {
  loading = false;
  settingsForm: UntypedFormGroup;
  PropertyType = PropertyType;
  keyTooltip =
    'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
  upsert$: Observable<AppConnection | null>;
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: CustomAuthDialogData,
    private store: Store,
    private dialogRef: MatDialogRef<CustomAuthConnectionDialogComponent>,
    private appConnectionsService: AppConnectionsService,
    private snackBar: MatSnackBar
  ) {
    const props: Record<string, FormControl> = {};
    Object.entries(this.dialogData.pieceAuthConfig.customAuthProps!).forEach(
      ([propName, prop]) => {
        if (prop.required) {
          props[propName] = new FormControl('', Validators.required);
        } else {
          props[propName] = new FormControl('');
        }
      }
    );

    this.settingsForm = this.fb.group({
      name: new FormControl(
        this.dialogData.connectionToUpdate?.name ||
          this.dialogData.pieceName.replace(/[^A-Za-z0-9_\\-]/g, '_'),
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
      ...props,
    });
    if (this.dialogData.connectionToUpdate) {
      this.settingsForm.patchValue(
        this.dialogData.connectionToUpdate.value.props
      );
      this.settingsForm.get('name')?.disable();
    }
  }
  dropdownCompareWithFunction = (opt: any, formControlValue: any) => {
    return formControlValue && deepEqual(opt, formControlValue);
  };
  submit() {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid) {
      this.loading = true;
      const propsValues = this.settingsForm.getRawValue();
      delete propsValues.name;
      const upsertRequest: UpsertCustomAuthRequest = {
        appName: this.dialogData.pieceName,
        name: this.settingsForm.getRawValue().name,
        value: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: propsValues,
        },
      };
      this.upsert$ = this.appConnectionsService.upsert(upsertRequest).pipe(
        catchError((err) => {
          console.error(err);
          this.snackBar.open(
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
