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
import { catchError, map, Observable, of, take, tap } from 'rxjs';
import {
  AppConnection,
  AppConnectionType,
  OAuth2AppConnection,
  PropertyType,
  UpsertOAuth2Request,
} from '@activepieces/shared';

import deepEqual from 'deep-equal';
import { fadeInUp400ms } from '../../../../../../../../../common/animation/fade-in-up.animation';
import { PieceConfig } from '../../../../../../../../../common/components/configs-form/connector-action-or-config';
import { AppConnectionsService } from '../../../../../../../../../common/service/app-connections.service';
import { CloudAuthConfigsService } from '../../../../../../../../../common/service/cloud-auth-configs.service';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';
import { BuilderSelectors } from '../../../../../../../../store/builder/builder.selector';
import { appConnectionsActions } from '../../../../../../../../store/app-connections/app-connections.action';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../../../../../../../../../common/model/oauth2-popup-params.interface';
import { environment } from '../../../../../../../../../../../environments/environment';

interface AuthConfigSettings {
  redirect_url: FormControl<string>;
  client_secret: FormControl<string>;
  client_id: FormControl<string>;
  name: FormControl<string>;
  value: FormControl<OAuth2PopupResponse>;
  props: UntypedFormGroup;
}
export const USE_CLOUD_CREDENTIALS = 'USE_CLOUD_CREDENTIALS';
@Component({
  selector: 'app-oauth2-connection-dialog',
  templateUrl: './oauth2-connection-dialog.component.html',
  styleUrls: ['./oauth2-connection-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class OAuth2ConnectionDialogComponent implements OnInit {
  PropertyType = PropertyType;
  readonly FAKE_CODE = 'FAKE_CODE';
  @Input() pieceAuthConfig: PieceConfig;
  @Input() pieceName: string;
  @Input() connectionToUpdate: OAuth2AppConnection | undefined;
  @Input() serverUrl: string;
  settingsForm: FormGroup<AuthConfigSettings>;
  loading = false;
  submitted = false;
  clientIdTooltip =
    'Your App ID, Key or Client ID. You can find it if you go to your app on the 3rd party service.';
  clientSecretTooltip =
    "Your App Secret. It's usually hidden and will show up when you click on Show in your app on the 3rd party service";
  redirectUrlTooltip =
    'Copy this URL and paste it under Redirect URL in your app on the 3rd party service. Activepieces predefines this because we manage the authentication flow.';
  scopesTooltip =
    'The permissions needed to access the endpoints you plan to work with on the 3rd party service.';
  keyTooltip =
    'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
  hasCloudAuthCred$: Observable<boolean>;
  upsert$: Observable<AppConnection | null>;
  constructor(
    private fb: FormBuilder,
    private store: Store,
    public dialogRef: MatDialogRef<OAuth2ConnectionDialogComponent>,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private appConnectionsService: AppConnectionsService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    dialogData: {
      pieceAuthConfig: PieceConfig;
      pieceName: string;
      connectionToUpdate: OAuth2AppConnection | undefined;
      serverUrl: string;
    }
  ) {
    this.pieceName = dialogData.pieceName;
    this.pieceAuthConfig = dialogData.pieceAuthConfig;
    this.connectionToUpdate = dialogData.connectionToUpdate;
    this.serverUrl = dialogData.serverUrl;
  }

  ngOnInit(): void {
    this.hasCloudAuthCred$ = this.cloudAuthConfigsService
      .getAppsAndTheirClientIds()
      .pipe(
        map((res) => {
          return !!res[this.pieceName];
        })
      );
    const propsControls = this.createPropsFormGroup();
    this.settingsForm = this.fb.group({
      redirect_url: new FormControl(
        this.serverUrl ? `${this.serverUrl}/redirect` : '',
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      client_secret: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      client_id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
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
      value: new FormControl(
        { code: '' },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      props: this.fb.group(propsControls),
    });
    this.settingsForm.controls.name.markAllAsTouched();
    if (environment.production) {
      this.settingsForm.controls.redirect_url.disable();
    }
    if (this.connectionToUpdate) {
      this.settingsForm.controls.name.setValue(this.connectionToUpdate.name);
      this.settingsForm.controls.client_id.setValue(
        this.connectionToUpdate.value.client_id
      );
      this.settingsForm.controls.client_secret.setValue(
        this.connectionToUpdate.value.client_secret
      );
      this.settingsForm.controls.redirect_url.setValue(
        this.connectionToUpdate.value.redirect_url
      );
      this.settingsForm.controls.name.disable();
      this.settingsForm.controls.redirect_url.disable();
      this.settingsForm.controls.client_id.disable();
      this.settingsForm.controls.client_secret.disable();
      this.connectionToUpdate.value.props
        ? this.settingsForm.controls.props.setValue(
          this.connectionToUpdate.value.props
        )
        : null;
      this.settingsForm.controls.props.disable();
      this.settingsForm.controls.value.setValue({ code: this.FAKE_CODE });
    }
  }
  submit() {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid && !this.loading) {
      this.loading = true;
      const connection = this.constructConnection();
      this.saveConnection(connection);
    }
  }
  constructConnection() {
    const connectionName = this.connectionToUpdate
      ? this.connectionToUpdate.name
      : this.settingsForm.controls.name.value;
    const newConnection: UpsertOAuth2Request = {
      name: connectionName,
      appName: this.pieceName,
      value: {
        code: this.settingsForm.controls.value.value.code,
        code_challenge: this.settingsForm.controls.value.value.code_challenge,
        type: AppConnectionType.OAUTH2,
        client_id: this.settingsForm.controls.client_id.value,
        client_secret: this.settingsForm.controls.client_secret.value,
        redirect_url: this.settingsForm.controls.redirect_url.getRawValue(),
        scope: this.pieceAuthConfig.scope!.join(' ') || '',
        token_url: this.pieceAuthConfig.tokenUrl!,
        props: this.pieceAuthConfig.oAuthProps
          ? this.settingsForm.controls.props.value
          : undefined,
      },
    };

    return newConnection;
  }

  dropdownCompareWithFunction = (opt: any, formControlValue: any) => {
    return formControlValue && deepEqual(opt, formControlValue);
  };

  saveConnection(connection: UpsertOAuth2Request): void {
    if (connection.value.code === this.FAKE_CODE) {
      this.dialogRef.close(connection);
      return;
    }
    this.upsert$ = this.appConnectionsService.upsert(connection).pipe(
      catchError((err) => {
        console.error(err);
        this.snackbar.open(
          'Connection failed, make sure client id and secret is correct.',
          'Close',
          { panelClass: 'error', duration: 5000 }
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
      .filter((k) => k !== 'value' && !this.settingsForm.controls[k].disabled)
      .map((key) => {
        return this.settingsForm.controls[key].valid;
      })
      .reduce((prev, next) => {
        return prev && next;
      }, true);
  }
  useCloudCreds() {
    this.dialogRef.close(USE_CLOUD_CREDENTIALS);
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

  getOAuth2Settings(): OAuth2PopupParams {
    const formValue = this.settingsForm.getRawValue();
    let authUrl = this.pieceAuthConfig.authUrl!;
    let tokenUrl = this.pieceAuthConfig.tokenUrl!;
    if (this.pieceAuthConfig.oAuthProps) {
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
      client_id: formValue.client_id,
      extraParams: this.pieceAuthConfig.oAuthProps || {},
      redirect_url: formValue.redirect_url,
      pkce: this.pieceAuthConfig.pkce,
      scope: this.pieceAuthConfig.scope!.join(' '),
    };
  }
}
