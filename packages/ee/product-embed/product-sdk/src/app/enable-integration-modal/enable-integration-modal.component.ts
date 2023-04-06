import { Component, Inject, Optional } from '@angular/core';
import { catchError, mapTo, Observable, switchMap, tap } from 'rxjs';
import {
  AppCredential,
  AppCredentialType,
} from '@activepieces/ee/shared';
import { DialogRef } from '@angular/cdk/dialog';
import { ConnectionService } from '../service/connection.service';
import { getLocal, getRedrectUrl, StorageName } from '../helper/helper';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalCommunicationService } from '../service/modal-communication.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-enable-integration-modal',
  templateUrl: './enable-integration-modal.component.html',
  styleUrls: ['./enable-integration-modal.component.scss'],
})
export class EnableIntegrationModalComponent {
  loading = false;
  connected = false;
  popUpOpen$: Observable<void> | undefined;

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
    if (this.data.credential.settings.type !== AppCredentialType.OAUTH2) {
      return;
    }
    if (!this.loading) {
      this.loading = true;
      this.popUpOpen$ = this.authenticationService
        .openPopUp(this.data.credential.settings)
        .pipe(
          switchMap((params) => {
            return this.connectionService.create({
              props: {},
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

  close() {
    this.dialogRef.close();
  }
}
