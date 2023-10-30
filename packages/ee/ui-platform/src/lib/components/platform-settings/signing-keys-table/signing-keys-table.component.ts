import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SigningKeysDataSource } from './signing-keys-table.datasource';
import { Subject, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateSigningKeyDialogComponent } from './create-signing-key-dialog/create-signing-key-dialog.component';
import { startWith } from 'rxjs';
import { SigningKeysService } from '@activepieces/ee-components';
import { SigningKey } from '@activepieces/ee-shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';

@Component({
  selector: 'app-signing-keys-table',
  templateUrl: './signing-keys-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigningKeysTableComponent {
  displayedColumns = ['displayName', 'created', 'action'];
  dataSource: SigningKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  constructor(
    private matDialog: MatDialog,
    private signingKeysService: SigningKeysService
  ) {
    this.dataSource = new SigningKeysDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.signingKeysService
    );
  }
  createKey() {
    this.matDialog.open(CreateSigningKeyDialogComponent, {
      disableClose: true,
    });
  }

  deleteKey(key: SigningKey) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.signingKeysService.delete(key.id).pipe(
        tap(() => {
          this.refresh$.next(true);
        })
      ),
      entityName: key.displayName,
      note: $localize`This will permanently delete the key, all embedding that was using this key will break.`,
    };
    this.matDialog.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
  }
}
