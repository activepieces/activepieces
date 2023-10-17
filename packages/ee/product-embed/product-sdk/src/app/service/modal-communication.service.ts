import { AppConnection } from '@activepieces/shared';
import { AppCredential } from '@activepieces/ee-shared';
import { DisableIntegrationModalComponent } from '../disable-integration-modal/disable-integration-modal.component';
import { EnableIntegrationModalComponent } from '../enable-integration-modal/enable-integration-modal.component';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalCommunicationService {
  constructor(private dialog: MatDialog) {}
  connectionSubject = new Subject<AppConnection>();
  disconnectionSubject = new Subject<AppConnection>();

  showModal(component: any, data: Record<string, unknown>) {
    const modal = this.dialog.open(component, {
      data: data,
      panelClass: 'my-dialog',
    });
    return modal;
  }

  openEnableIntegrationModal(appCredential: AppCredential) {
    this.dialog.closeAll();
    const modal = this.showModal(EnableIntegrationModalComponent, {
      credential: appCredential,
    });
    return modal;
  }

  openDisableIntegrationModal(connection: AppConnection) {
    this.dialog.closeAll();
    const modal = this.showModal(DisableIntegrationModalComponent, {
      connection: connection,
    });
    return modal;
  }
}
