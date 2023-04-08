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
  UpsertCustomAuthRequest,
} from '@activepieces/shared';
import {
  CustomAuthProps,
  CustomAuthProperty,
  PropertyType,
} from '@activepieces/framework';
import deepEqual from 'deep-equal';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConnectionsService } from '../../services/app-connections.service';
import { ConnectionValidator } from '../../validators/connectionNameValidator';
import {
  BuilderSelectors,
  appConnectionsActions,
} from '@activepieces/ui/feature-builder-store';

export interface CustomAuthDialogData {
  pieceAuthProperty: CustomAuthProperty<boolean, CustomAuthProps>;
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
    Object.entries(this.dialogData.pieceAuthProperty.props).forEach(
      ([propName, prop]) => {
        if (prop.required) {
          props[propName] = new FormControl(
            prop.defaultValue ?? '',
            Validators.required
          );
        } else {
          props[propName] = new FormControl(prop.defaultValue ?? '');
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
