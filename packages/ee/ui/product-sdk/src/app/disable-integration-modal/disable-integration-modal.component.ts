import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Optional,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { AppConnection } from '@activepieces/shared';
import { getLocal, StorageName } from '../helper/helper';
import { ModalCommunicationService } from '../service/modal-communication.service';
import { ConnectionService } from '../service/connection.service';

@Component({
  selector: 'app-disable-integration-modal',
  templateUrl: './disable-integration-modal.component.html',
  styleUrls: ['./disable-integration-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisableIntegrationModalComponent {
  delete$: Observable<void> | undefined;
  loading = false;

  connection: AppConnection;

  constructor(
    public dialogRef: DialogRef,
    private connectionService: ConnectionService,
    private modalCommunicationService: ModalCommunicationService,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: { connection: AppConnection }
  ) {
    this.connection = data.connection;
  }

  delete() {
    if (!this.loading) {
      this.loading = true;
      this.delete$ = this.connectionService
        .delete({
          appName: this.connection.pieceName,
          projectId: getLocal(StorageName.PROJECT_ID),
          token: getLocal(StorageName.TOKEN),
        })
        .pipe(
          tap(() => {
            this.modalCommunicationService.disconnectionSubject.next(
              this.connection
            );
            this.close();
          })
        );
    }
  }

  close() {
    this.dialogRef.close();
  }
}
