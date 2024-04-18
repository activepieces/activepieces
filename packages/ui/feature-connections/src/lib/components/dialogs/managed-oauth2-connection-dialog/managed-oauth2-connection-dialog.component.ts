import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  UpsertCloudOAuth2Request,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  UpsertPlatformOAuth2Request,
  ApFlagId,
} from '@activepieces/shared';
import deepEqual from 'deep-equal';
import {
  AppConnectionsService,
  AuthenticationService,
  FlagService,
  fadeInUp400ms,
} from '@activepieces/ui/common';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../../../models/oauth2-popup-params.interface';
import {
  PropertyType,
  OAuth2Property,
  OAuth2Props,
  StaticDropdownProperty,
} from '@activepieces/pieces-framework';
import { createConnectionNameControl } from '../utils';

interface AuthConfigSettings {
  name: FormControl<string>;
  value: FormControl<OAuth2PopupResponse | null>;
  props: UntypedFormGroup;
}

export const USE_MY_OWN_CREDENTIALS = 'USE_MY_OWN_CREDENTIALS';
export type ManagedOAuth2ConnectionDialogData = {
  pieceAuthProperty: OAuth2Property<OAuth2Props>;
  pieceName: string;
  connectionToUpdate?: AppConnectionWithoutSensitiveData;
  clientId: string;
  isTriggerAppWebhook: boolean;
  connectionType:
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  frontendUrl: string;
  pieceDisplayName: string;
};

@Component({
  selector: 'app-managed-oauth2-dialog',
  templateUrl: './managed-oauth2-connection-dialog.component.html',
  styleUrls: ['./managed-oauth2-connection-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class ManagedOAuth2ConnectionDialogComponent implements OnInit {
  readonly FAKE_CODE = 'FAKE_CODE';
  _managedOAuth2ConnectionPopupSettings: OAuth2PopupParams;
  PropertyType = PropertyType;
  settingsForm: FormGroup<AuthConfigSettings>;
  loading = false;
  upsert$: Observable<AppConnectionWithoutSensitiveData | null>;
  keyTooltip = $localize`The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.`;
  isTriggerAppWebhook = false;
  ownAuthEnabled$: Observable<boolean>;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ManagedOAuth2ConnectionDialogComponent>,
    private appConnectionsService: AppConnectionsService,
    private flagService: FlagService,
    private authenticationService: AuthenticationService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: ManagedOAuth2ConnectionDialogData
  ) {
    this._managedOAuth2ConnectionPopupSettings = {
      auth_url: this.dialogData.pieceAuthProperty.authUrl,
      redirect_url:
        //TODO: decide whether redirect URL should be decided like this or some other way
        this.dialogData.connectionType === AppConnectionType.PLATFORM_OAUTH2
          ? this.dialogData.frontendUrl + '/redirect'
          : 'https://secrets.activepieces.com/redirect',
      scope: this.dialogData.pieceAuthProperty.scope.join(' '),
      pkce: this.dialogData.pieceAuthProperty.pkce,
      extraParams: this.dialogData.pieceAuthProperty.extra || {},
      client_id: this.dialogData.clientId,
    };
    this.ownAuthEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.OWN_AUTH2_ENABLED
    );
    this.isTriggerAppWebhook = this.dialogData.isTriggerAppWebhook;
  }

  ngOnInit(): void {
    const propsControls = this.createPropsFormGroup();
    this.settingsForm = this.fb.group({
      name: createConnectionNameControl({
        appConnectionsService: this.appConnectionsService,
        pieceName: this.dialogData.pieceName,
        existingConnectionName: this.dialogData.connectionToUpdate?.name,
      }),
      value: new FormControl<OAuth2PopupResponse | null>(null, {
        validators: Validators.required,
      }),
      props: this.fb.group(propsControls),
    });
    if (this.dialogData.connectionToUpdate) {
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
  constructConnection():
    | UpsertCloudOAuth2Request
    | UpsertPlatformOAuth2Request {
    const connectionName = this.dialogData.connectionToUpdate
      ? this.dialogData.connectionToUpdate.name
      : this.settingsForm.controls.name.value;
    const popupResponse = this.settingsForm.value.value!;
    if (this.dialogData.connectionType === AppConnectionType.CLOUD_OAUTH2) {
      const newConnection: UpsertCloudOAuth2Request = {
        projectId: this.authenticationService.getProjectId(),
        pieceName: this.dialogData.pieceName,
        type: AppConnectionType.CLOUD_OAUTH2,
        value: {
          code: popupResponse.code,
          authorization_method:
            this.dialogData.pieceAuthProperty.authorizationMethod,
          code_challenge: popupResponse.code_challenge,
          client_id: this._managedOAuth2ConnectionPopupSettings.client_id,
          scope: this._managedOAuth2ConnectionPopupSettings.scope,
          type: AppConnectionType.CLOUD_OAUTH2,
          props: this.dialogData.pieceAuthProperty.props
            ? this.settingsForm.controls.props.value
            : undefined,
        },
        name: connectionName,
      };
      return newConnection;
    } else {
      const newConnection: UpsertPlatformOAuth2Request = {
        projectId: this.authenticationService.getProjectId(),
        pieceName: this.dialogData.pieceName,
        type: AppConnectionType.PLATFORM_OAUTH2,
        value: {
          code: popupResponse.code,
          authorization_method:
            this.dialogData.pieceAuthProperty.authorizationMethod,
          code_challenge: popupResponse.code_challenge,
          client_id: this._managedOAuth2ConnectionPopupSettings.client_id,
          scope: this._managedOAuth2ConnectionPopupSettings.scope,
          type: AppConnectionType.PLATFORM_OAUTH2,
          props: this.dialogData.pieceAuthProperty.props
            ? this.settingsForm.controls.props.value
            : undefined,
          redirect_url: this.dialogData.frontendUrl + '/redirect',
        },
        name: connectionName,
      };
      return newConnection;
    }
  }
  createPropsFormGroup() {
    const controls: Record<string, FormControl> = {};
    if (this.dialogData.pieceAuthProperty.props) {
      Object.keys(this.dialogData.pieceAuthProperty.props).forEach((key) => {
        controls[key] = new FormControl('', {
          validators: [Validators.required],
        });
      });
    }
    return controls;
  }
  saveConnection(
    connection: UpsertCloudOAuth2Request | UpsertPlatformOAuth2Request
  ): void {
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
          this.dialogRef.close(connection);
        }
        this.loading = false;
      })
    );
  }
  get authenticationSettingsControlsValid() {
    return Object.keys(this.settingsForm.controls)
      .filter(
        (key) =>
          key !== 'connection' &&
          !this.settingsForm.controls[key as keyof AuthConfigSettings].disabled
      )
      .map((key) => {
        return this.settingsForm.controls[key as keyof AuthConfigSettings]
          .valid;
      })
      .reduce((prev, next) => {
        return prev && next;
      }, true);
  }

  useOwnCred() {
    this.dialogRef.close(USE_MY_OWN_CREDENTIALS);
  }

  get cloudConnectionPopupSettings(): OAuth2PopupParams {
    const authUrl = this.resolveUrlWithProps(
      this.dialogData.pieceAuthProperty.authUrl,
      this.dialogData.pieceAuthProperty.props
    );
    const scope = this.resolveUrlWithProps(
      this.dialogData.pieceAuthProperty.scope!.join(' '),
      this.dialogData.pieceAuthProperty.props
    );
    return {
      auth_url: authUrl,
      client_id: this._managedOAuth2ConnectionPopupSettings.client_id,
      extraParams: this.dialogData.pieceAuthProperty.extra || {},
      redirect_url: this._managedOAuth2ConnectionPopupSettings.redirect_url,
      pkce: this.dialogData.pieceAuthProperty.pkce,
      scope: scope,
    };
  }
  resolveUrlWithProps(url: string, props: Record<string, any> | undefined) {
    if (!props) {
      return url;
    }
    Object.keys(props).forEach((key) => {
      url = url.replaceAll(
        `{${key}}`,
        this.settingsForm.controls.props.value[key]
      );
    });
    return url;
  }

  dropdownCompareWithFunction = (opt: any, formControlValue: any) => {
    return formControlValue && deepEqual(opt, formControlValue);
  };

  castToStaticDropdown(t: unknown) {
    return t as StaticDropdownProperty<unknown, true>;
  }
}
