import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, take, tap } from 'rxjs';
import {
  AppConnection,
  UpsertCloudOAuth2Request,
  CloudOAuth2ConnectionValue,
  CloudAuth2Connection,
  PropertyType,
} from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { fadeInUp400ms } from '../../../../../../../../../common/animation/fade-in-up.animation';
import { PieceConfig } from '../../../../../../../../../common/components/configs-form/connector-action-or-config';
import { CloudConnectionPopupSettings } from '../../../../../../../../../common/components/form-controls/o-auth2-cloud-connect-control/o-auth2-cloud-connect-control.component';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';
import { BuilderSelectors } from '../../../../../../../../store/builder/builder.selector';
import { appConnectionsActions } from '../../../../../../../../store/app-connections/app-connections.action';
import { AppConnectionsService } from '../../../../../../../../../common/service/app-connections.service';

interface AuthConfigSettings {
  appName: FormControl<string | null>;
  name: FormControl<string>;
  value: FormControl<CloudOAuth2ConnectionValue>;
  props: UntypedFormGroup;
}
export const USE_MY_OWN_CREDENTIALS = 'USE_MY_OWN_CREDENTIALS';
@Component({
  selector: 'app-cloud-authentication-modal',
  templateUrl: './cloud-oauth2-connection-dialog.component.html',
  styleUrls: ['./cloud-oauth2-connection-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class CloudOAuth2ConnectionDialogComponent implements OnInit {
  @Input() pieceAuthConfig: PieceConfig;
  @Input() pieceName: string;
  @Input() connectionToUpdate: CloudAuth2Connection | undefined;
  _cloudConnectionPopupSettings: CloudConnectionPopupSettings;
  PropertyType = PropertyType;
  settingsForm: FormGroup<AuthConfigSettings>;
  loading = false;
  upsert$: Observable<AppConnection | null>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  constructor(
    private fb: FormBuilder,
    private store: Store,
    public dialogRef: MatDialogRef<CloudOAuth2ConnectionDialogComponent>,
    private appConnectionsService: AppConnectionsService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    dialogData: {
      pieceAuthConfig: PieceConfig;
      pieceName: string;
      connectionToUpdate: CloudAuth2Connection | undefined;
      clientId: string;
    }
  ) {
    this.pieceName = dialogData.pieceName;
    this.pieceAuthConfig = dialogData.pieceAuthConfig;
    this.connectionToUpdate = dialogData.connectionToUpdate;
    this._cloudConnectionPopupSettings = {
      auth_url: this.pieceAuthConfig.authUrl!,
      scope: this.pieceAuthConfig.scope!.join(' '),
      extraParams: this.pieceAuthConfig.extra!,
      pieceName: this.pieceName,
      clientId: dialogData.clientId,
    };
  }

  ngOnInit(): void {
    const propsControls = this.createPropsFormGroup();
    this.settingsForm = this.fb.group({
      appName: new FormControl<string | null>(this.pieceName, {
        nonNullable: false,
        validators: [],
      }),
      name: new FormControl(this.pieceName.replace(/[^A-Za-z0-9_]/g, '_'), {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
        asyncValidators: [
          ConnectionValidator.createValidator(
            this.store
              .select(BuilderSelectors.selectAllAppConnections)
              .pipe(take(1)),
            undefined
          ),
        ],
      }),
      value: new FormControl(undefined as any, Validators.required),
      props: this.fb.group(propsControls),
    });
    if (this.connectionToUpdate) {
      this.settingsForm.controls.value.setValue(this.connectionToUpdate.value);
      this.settingsForm.controls.name.setValue(this.connectionToUpdate.name);
      this.settingsForm.controls.name.disable();
      if (this.connectionToUpdate.value.props) {
        this.settingsForm.controls.props.setValue(
          this.connectionToUpdate.value.props
        );
      }
    }
    this.settingsForm.controls.name.markAllAsTouched();
  }
  submit() {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid && !this.loading) {
      this.loading = true;
      const config = this.constructConnection();
      this.saveConnection(config);
    }
  }
  constructConnection() {
    const connectionName = this.connectionToUpdate
      ? this.connectionToUpdate.name
      : this.settingsForm.controls.name.value;
    const settingsFormValue = this.getOAuth2Settings();
    const connectionValue = settingsFormValue.value;
    const newConnection: UpsertCloudOAuth2Request = {
      appName: this.pieceName,
      value: {
        token_url: settingsFormValue['token_url'],
        ...connectionValue,
        scope: this._cloudConnectionPopupSettings.scope,
        props: this.pieceAuthConfig.oAuthProps
          ? this.settingsForm.controls.props.value
          : undefined,
      },
      name: connectionName,
    };
    return newConnection;
  }
  createPropsFormGroup() {
    const controls: Record<string, FormControl> = {};
    if (this.pieceAuthConfig.oAuthProps) {
      Object.keys(this.pieceAuthConfig.oAuthProps).forEach((key) => {
        controls[key] = new FormControl('', {
          validators: [Validators.required],
        });
      });
    }
    return controls;
  }
  saveConnection(connection: UpsertCloudOAuth2Request): void {
    this.upsert$ = this.appConnectionsService.upsert(connection).pipe(
      catchError((err) => {
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
  get authenticationSettingsControlsValid() {
    return Object.keys(this.settingsForm.controls)
      .filter(
        (k) => k !== 'connection' && !this.settingsForm.controls[k].disabled
      )
      .map((key) => {
        return this.settingsForm.controls[key].valid;
      })
      .reduce((prev, next) => {
        return prev && next;
      }, true);
  }

  useOwnCred() {
    this.dialogRef.close(USE_MY_OWN_CREDENTIALS);
  }
  getOAuth2Settings() {
    const formValue = this.settingsForm.getRawValue();
    if (this.pieceAuthConfig.oAuthProps) {
      let authUrl = this.pieceAuthConfig.authUrl!;
      let tokenUrl = this.pieceAuthConfig.tokenUrl!;
      Object.keys(this.pieceAuthConfig.oAuthProps).forEach((key) => {
        authUrl = authUrl.replaceAll(
          `{${key}}`,
          this.settingsForm.controls.props.value[key]
        );
        tokenUrl = tokenUrl.replaceAll(
          `{${key}}`,
          this.settingsForm.controls.props.value[key]
        );
      });
      return { ...formValue, auth_url: authUrl, token_url: tokenUrl };
    }
    return formValue;
  }
  get cloudConnectionPopupSettings() {
    if (
      this.pieceAuthConfig.oAuthProps &&
      this.getOAuth2Settings()['auth_url']
    ) {
      this._cloudConnectionPopupSettings.auth_url =
        this.getOAuth2Settings()['auth_url'];
      this._cloudConnectionPopupSettings.token_url =
        this.getOAuth2Settings()['token_url'];
    }
    return this._cloudConnectionPopupSettings;
  }
  dropdownCompareWithFunction = (opt: any, formControlValue: any) => {
    return formControlValue && deepEqual(opt, formControlValue);
  };
}
