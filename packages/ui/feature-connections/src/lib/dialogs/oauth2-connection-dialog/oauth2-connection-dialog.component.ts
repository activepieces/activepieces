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
import { Store } from '@ngrx/store';
import { catchError, map, Observable, of, take, tap } from 'rxjs';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  OAuth2GrantType,
  UpsertOAuth2Request,
} from '@activepieces/shared';
import {
  OAuth2Property,
  OAuth2Props,
  PropertyType,
  StaticMultiSelectDropdownProperty,
} from '@activepieces/pieces-framework';
import deepEqual from 'deep-equal';
import {
  AuthenticationService,
  appConnectionsSelectors,
  environment,
  appConnectionsActions,
  fadeInUp400ms,
} from '@activepieces/ui/common';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../../models/oauth2-popup-params.interface';
import { CloudAuthConfigsService } from '../../services/cloud-auth-configs.service';
import { AppConnectionsService } from '@activepieces/ui/common';
import { ConnectionValidator } from '../../validators/connectionNameValidator';
import { connectionNameRegex } from '../utils';

interface OAuth2PropertySettings {
  redirect_url: FormControl<string>;
  client_secret: FormControl<string>;
  client_id: FormControl<string>;
  name: FormControl<string>;
  value: FormControl<OAuth2PopupResponse | null>;
  props: UntypedFormGroup;
}
export const USE_CLOUD_CREDENTIALS = 'USE_CLOUD_CREDENTIALS';
export interface OAuth2ConnectionDialogData {
  pieceAuthProperty: OAuth2Property<OAuth2Props>;
  pieceName: string;
  connectionToUpdate?: AppConnectionWithoutSensitiveData;
  redirectUrl: string;
  pieceDisplayName: string;
}

@Component({
  selector: 'app-oauth2-connection-dialog',
  templateUrl: './oauth2-connection-dialog.component.html',
  styleUrls: ['./oauth2-connection-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class OAuth2ConnectionDialogComponent implements OnInit {
  PropertyType = PropertyType;
  readonly OAuth2GrantType = OAuth2GrantType;
  settingsForm: FormGroup<OAuth2PropertySettings>;
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
  upsert$: Observable<AppConnectionWithoutSensitiveData | null>;
  constructor(
    private fb: FormBuilder,
    private store: Store,
    public dialogRef: MatDialogRef<OAuth2ConnectionDialogComponent>,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private appConnectionsService: AppConnectionsService,
    private authenticatiionService: AuthenticationService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: OAuth2ConnectionDialogData
  ) {}

  ngOnInit(): void {
    this.hasCloudAuthCred$ = this.cloudAuthConfigsService
      .getAppsAndTheirClientIds()
      .pipe(
        map((res) => {
          return !!res[this.dialogData.pieceName];
        })
      );
    const propsControls = this.createPropsFormGroup();
    this.settingsForm = this.fb.group({
      redirect_url: new FormControl(this.dialogData.redirectUrl, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      client_secret: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      client_id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: new FormControl(
        this.appConnectionsService.getConnectionNameSuggest(
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
      value: new FormControl<OAuth2PopupResponse | null>(null, {
        validators: Validators.required,
      }),
      props: this.fb.group(propsControls),
    });
    this.settingsForm.controls.name.markAllAsTouched();
    if (environment.production) {
      this.settingsForm.controls.redirect_url.disable();
    }
    if (this.dialogData.connectionToUpdate) {
      this.settingsForm.controls.name.setValue(
        this.dialogData.connectionToUpdate.name
      );
      this.settingsForm.controls.name.disable();
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
    const connectionName = this.dialogData.connectionToUpdate
      ? this.dialogData.connectionToUpdate.name
      : this.settingsForm.controls.name.value;
    const scope = this.resolveUrlWithProps(
      this.dialogData.pieceAuthProperty.scope!.join(' '),
      this.settingsForm.controls.props.value
    );
    const newConnection: UpsertOAuth2Request = {
      projectId: this.authenticatiionService.getProjectId(),
      name: connectionName,
      pieceName: this.dialogData.pieceName,
      type: AppConnectionType.OAUTH2,
      value: {
        code: this.settingsForm.controls.value.value!.code,
        code_challenge: this.settingsForm.controls.value.value!.code_challenge,
        type: AppConnectionType.OAUTH2,
        grant_type:
          this.dialogData.pieceAuthProperty.grantType ??
          OAuth2GrantType.AUTHORIZATION_CODE,
        authorization_method:
          this.dialogData.pieceAuthProperty.authorizationMethod,
        client_id: this.settingsForm.controls.client_id.value,
        client_secret: this.settingsForm.controls.client_secret.value,
        redirect_url: this.settingsForm.controls.redirect_url.getRawValue(),
        scope: scope || '',
        props: this.dialogData.pieceAuthProperty.props
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
      .filter(
        (k) =>
          k !== 'value' &&
          !this.settingsForm.controls[k as keyof OAuth2PropertySettings]
            .disabled
      )
      .map((key) => {
        return this.settingsForm.controls[key as keyof OAuth2PropertySettings]
          .valid;
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
    if (this.dialogData.pieceAuthProperty.props) {
      Object.keys(this.dialogData.pieceAuthProperty.props).forEach((key) => {
        controls[key] = new FormControl('', {
          validators: [Validators.required],
        });
      });
    }
    return controls;
  }

  getOAuth2Settings(): OAuth2PopupParams {
    const formValue = this.settingsForm.getRawValue();
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
      client_id: formValue.client_id,
      extraParams: this.dialogData.pieceAuthProperty.extra || {},
      redirect_url: formValue.redirect_url,
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

  castToStaticDropdown(t: unknown) {
    return t as StaticMultiSelectDropdownProperty<unknown, true>;
  }
}
