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
  CloudAuth2Connection,
  PropertyType,
  AppConnectionType,
} from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { fadeInUp400ms } from '../../../../../../../../../common/animation/fade-in-up.animation';
import { PieceConfig } from '../../../../../../../../../common/components/configs-form/connector-action-or-config';
import { AppConnectionsService } from '../../../../../../../../../common/service/app-connections.service';
import { BuilderSelectors } from '../../../../../../../../store/builder/builder.selector';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';
import { appConnectionsActions } from '../../../../../../../../store/app-connections/app-connections.action';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../../../../../../../../../common/model/oauth2-popup-params.interface';

interface AuthConfigSettings {
  name: FormControl<string>;
  value: FormControl<OAuth2PopupResponse>;
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
  readonly FAKE_CODE = 'FAKE_CODE';
  @Input() pieceAuthConfig: PieceConfig;
  @Input() pieceName: string;
  @Input() connectionToUpdate: CloudAuth2Connection | undefined;
  _cloudConnectionPopupSettings: OAuth2PopupParams;
  PropertyType = PropertyType;
  settingsForm: FormGroup<AuthConfigSettings>;
  loading = false;
  upsert$: Observable<AppConnection | null>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  isTriggerAppWebhook = false;
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
      isTriggerAppWebhook: boolean;
    }
  ) {
    this.pieceName = dialogData.pieceName;
    this.pieceAuthConfig = dialogData.pieceAuthConfig;
    this.connectionToUpdate = dialogData.connectionToUpdate;
    this._cloudConnectionPopupSettings = {
      auth_url: this.pieceAuthConfig.authUrl!,
      redirect_url: 'https://secrets.activepieces.com/redirect',
      scope: this.pieceAuthConfig.scope!.join(' '),
      pkce: this.pieceAuthConfig.pkce,
      extraParams: this.pieceAuthConfig.extra!,
      client_id: dialogData.clientId,
    };
    this.isTriggerAppWebhook = dialogData.isTriggerAppWebhook;
  }

  ngOnInit(): void {
    const propsControls = this.createPropsFormGroup();
    this.settingsForm = this.fb.group({
      name: new FormControl(this.pieceName.replace(/[^A-Za-z0-9_\\-]/g, '_'), {
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
      }),
      value: new FormControl(
        { code: '' },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      props: this.fb.group(propsControls),
    });
    if (this.connectionToUpdate) {
      this.settingsForm.controls.name.setValue(this.connectionToUpdate.name);
      this.settingsForm.controls.name.disable();
      if (this.connectionToUpdate.value.props) {
        this.settingsForm.controls.props.setValue(
          this.connectionToUpdate.value.props
        );
        this.settingsForm.controls.props.disable();
      }
      this.settingsForm.controls.value.setValue({ code: this.FAKE_CODE });
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
    const popupResponse = this.settingsForm.value.value!;
    const newConnection: UpsertCloudOAuth2Request = {
      appName: this.pieceName,
      value: {
        token_url: this.settingsForm.value['token_url'],
        code: popupResponse.code,
        code_challenge: popupResponse.code_challenge,
        client_id: this._cloudConnectionPopupSettings.client_id,
        scope: this._cloudConnectionPopupSettings.scope,
        type: AppConnectionType.CLOUD_OAUTH2,
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
    if (connection.value.code === this.FAKE_CODE) {
      this.dialogRef.close(connection);
      return;
    }
    this.upsert$ = this.appConnectionsService.upsert(connection).pipe(
      catchError((err) => {
        console.error(err);
        this.snackbar.open('Connection failed, please try again.', 'Close', {
          panelClass: 'error',
          duration: 5000,
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

  get cloudConnectionPopupSettings(): OAuth2PopupParams {
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
    }
    return {
      auth_url: this.pieceAuthConfig.authUrl!,
      client_id: this._cloudConnectionPopupSettings.client_id,
      extraParams: this.pieceAuthConfig.oAuthProps || {},
      redirect_url: this._cloudConnectionPopupSettings.redirect_url,
      pkce: this.pieceAuthConfig.pkce,
      scope: this.pieceAuthConfig.scope!.join(' '),
    };
  }

  dropdownCompareWithFunction = (opt: any, formControlValue: any) => {
    return formControlValue && deepEqual(opt, formControlValue);
  };
}
