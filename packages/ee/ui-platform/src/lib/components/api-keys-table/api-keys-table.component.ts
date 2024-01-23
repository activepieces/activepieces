import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, tap, startWith } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
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
export class ApiKeysTableComponent {
  displayedColumns = ['displayName', 'truncatedValue', 'created', 'action'];
  dataSource: ApiKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  constructor(
    private matDialog: MatDialog,
    private apiKeysService: ApiKeysService
  ) {
    this.dataSource = new ApiKeysDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.apiKeysService
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
      note: $localize`This will permanently delete the key, all existing access wil be revoked.`,
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
