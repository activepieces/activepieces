import { Component, Inject, Optional } from '@angular/core';
import { catchError, map, mapTo, Observable, switchMap, tap } from 'rxjs';
import {
  AppCredential,
  AppCredentialType,
  AppOAuth2Settings,
} from '@activepieces/ee-shared';
import { DialogRef } from '@angular/cdk/dialog';
import { ConnectionService } from '../service/connection.service';
import { getLocal, getRedrectUrl, StorageName } from '../helper/helper';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalCommunicationService } from '../service/modal-communication.service';
import { AuthService } from '../service/auth.service';
import { FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { OAuth2GrantType, assertNotEqual } from '@activepieces/shared';

@Component({
  selector: 'app-enable-integration-modal',
  templateUrl: './enable-integration-modal.component.html',
  styleUrls: ['./enable-integration-modal.component.scss'],
})
export class EnableIntegrationModalComponent {
  loading = false;
  connected = false;
  popUpOpen$: Observable<void> | undefined;
  secretControlForm: FormControl<string> = new FormControl();
  propsForm: FormControl<boolean> = new FormControl();
  errorMessage: string | undefined;

  constructor(
    private dialogRef: DialogRef,
    private authenticationService: AuthService,
    private modalCommunicationService: ModalCommunicationService,
    private connectionService: ConnectionService,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: { credential: AppCredential }
  ) {}

  connect() {
    switch (this.data.credential.settings.type) {
      case AppCredentialType.OAUTH2:
        this.connectOAuth2();
        break;
      case AppCredentialType.API_KEY:
        this.connectApiKey();
        break;
    }
  }

  connectApiKey() {
    if (!this.loading) {
      this.loading = true;
      this.errorMessage = undefined;
      this.popUpOpen$ = this.connectionService
        .create({
          apiKey: this.secretControlForm.value,
          appCredentialId: this.data.credential.id,
          token: getLocal(StorageName.TOKEN),
        })
        .pipe(
          tap((connection) => {
            this.modalCommunicationService.connectionSubject.next(connection);
            this.secretControlForm.setErrors(null);
            this.loading = false;
            this.connected = true;
          }),
          map(() => void 0),
          catchError((err: HttpErrorResponse) => {
            const error = err.error;
            this.errorMessage = error?.params?.error;
            this.secretControlForm.setErrors({ invalid: true });
            this.loading = false;
            throw err;
          })
        );
    }
  }

  connectOAuth2() {
    if (!this.loading) {
      this.loading = true;
      const OAuth2Settings: AppOAuth2Settings = JSON.parse(
        JSON.stringify(this.data.credential.settings)
      );
      let props: Record<string, string> = {};
      if (this.data.credential.appName === 'salesforce') {
        props = {
          environment: this.propsForm.value ? 'test' : 'login',
        };
        if (this.propsForm.value) {
          OAuth2Settings.authUrl =
            'https://test.salesforce.com/services/oauth2/authorize';
          OAuth2Settings.tokenUrl =
            'https://test.salesforce.com/services/oauth2/token';
        } else {
          OAuth2Settings.authUrl =
            'https://login.salesforce.com/services/oauth2/authorize';
          OAuth2Settings.tokenUrl =
            'https://login.salesforce.com/services/oauth2/token';
        }
      }
      if (this.data.credential.appName === 'kindful') {
        if (this.propsForm.value) {
          this.data.credential.id = 'rEi7s453CBAlRdnn7A3hn';
          OAuth2Settings.authUrl =
            'https://app-playground.kindful.com/admin/oauth2/authorize';
          OAuth2Settings.tokenUrl =
            'https://app-playground.kindful.com/admin/oauth2/token';
        } else {
          this.data.credential.id = 'Uw2PfQ1J52z3qSnl6eir5';
          OAuth2Settings.authUrl =
            'https://app.kindful.com/admin/oauth2/authorize';
          OAuth2Settings.tokenUrl =
            'https://app.kindful.com/admin/oauth2/token';
        }
      }
      assertNotEqual(
        OAuth2Settings.grantType,
        OAuth2GrantType.CLIENT_CREDENTIALS,
        'OAuth2GrantType',
        'AUTHORIZATION_CODE'
      );
      this.popUpOpen$ = this.authenticationService
        .openPopUp(OAuth2Settings)
        .pipe(
          switchMap((params) => {
            return this.connectionService.create({
              props,
              redirectUrl: getRedrectUrl(),
              appCredentialId: this.data.credential.id,
              token: getLocal(StorageName.TOKEN),
              code: (params as Record<string, string>)['code'] as string,
            });
          }),
          tap((connection) => {
            this.modalCommunicationService.connectionSubject.next(connection);
            this.loading = false;
            this.connected = true;
          }),
          mapTo(void 0),
          catchError((err) => {
            this.loading = false;
            throw err;
          })
        );
    }
  }

  get AppCredentialType() {
    return AppCredentialType;
  }
  close() {
    this.dialogRef.close();
  }
}
