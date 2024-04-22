import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  ErrorCode,
  UpsertCustomAuthRequest,
} from '@activepieces/shared';
import {
  CustomAuthProps,
  CustomAuthProperty,
  PropertyType,
} from '@activepieces/pieces-framework';
import deepEqual from 'deep-equal';
import {
  AppConnectionsService,
  AuthenticationService,
  DiagnosticDialogComponent,
} from '@activepieces/ui/common';
import { createConnectionNameControl } from '../utils';

export interface CustomAuthDialogData {
  pieceAuthProperty: CustomAuthProperty<CustomAuthProps>;
  pieceName: string;
  connectionToUpdate?: AppConnectionWithoutSensitiveData;
  pieceDisplayName: string;
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
  upsert$: Observable<AppConnectionWithoutSensitiveData | null>;
  openDiagnosticDialog$: Observable<void>;
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: CustomAuthDialogData,
    private dialogService: MatDialog,
    private authenticationService: AuthenticationService,
    private dialogRef: MatDialogRef<CustomAuthConnectionDialogComponent>,
    private appConnectionsService: AppConnectionsService
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
      name: createConnectionNameControl({
        appConnectionsService: this.appConnectionsService,
        pieceName: this.dialogData.pieceName,
        existingConnectionName: this.dialogData.connectionToUpdate?.name,
      }),
      ...props,
    });
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
        pieceName: this.dialogData.pieceName,
        projectId: this.authenticationService.getProjectId(),
        name: this.settingsForm.getRawValue().name,
        type: AppConnectionType.CUSTOM_AUTH,
        value: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: propsValues,
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
