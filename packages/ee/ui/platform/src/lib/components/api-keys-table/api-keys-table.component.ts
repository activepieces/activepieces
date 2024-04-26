import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, Subject, tap, startWith } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  PlatformService,
} from '@activepieces/ui/common';
import { ApiKeysService } from '../../service/api-keys.service';
import { ApiKeysDataSource } from './api-keys-table.datasource';
import { ApiKey } from '@activepieces/ee-shared';
import { CreateApiKeyDialogComponent } from '../dialogs/create-api-key-dialog/create-api-key-dialog.component';

@Component({
  selector: 'app-api-keys-table',
  templateUrl: './api-keys-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeysTableComponent implements OnInit {
  displayedColumns = ['displayName', 'truncatedValue', 'created', 'action'];
  dataSource!: ApiKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  isLocked$?: Observable<boolean>;
  dialogClosed$?: Observable<unknown>;
  upgradeNoteTitle = $localize`Enable API Access`;
  upgradeNote = $localize`Create and manage API keys to access Activepieces APIs.`;
  constructor(
    private matDialog: MatDialog,
    private apiKeysService: ApiKeysService,
    private platformService: PlatformService
  ) {}
  ngOnInit(): void {
    this.isLocked$ = this.platformService.apiKeysDisabled();
    this.dataSource = new ApiKeysDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.apiKeysService,
      this.isLocked$
    );
  }
  createKey() {
    const dialog = this.matDialog.open(CreateApiKeyDialogComponent, {
      disableClose: true,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }

  deleteKey(key: ApiKey) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.apiKeysService.delete(key.id).pipe(
        tap(() => {
          this.refresh$.next(true);
        })
      ),
      entityName: key.displayName,
      note: $localize`This will permanently delete the key, all existing access will be revoked.`,
    };
    const dialog = this.matDialog.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
}
