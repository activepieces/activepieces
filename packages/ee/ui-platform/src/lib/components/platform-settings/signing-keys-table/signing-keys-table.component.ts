import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SigningKey,
  SigningKeysDataSource,
} from './signing-keys-table.datasource';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateSigningKeyDialogComponent } from './create-signing-key-dialog/create-signing-key-dialog.component';
import { startWith } from 'rxjs';
@Component({
  selector: 'app-signing-keys-table',
  templateUrl: './signing-keys-table.component.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class SigningKeysTableComponent {
  displayedColumns = ['displayName', 'created', 'action'];
  dataSource: SigningKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  constructor(private matDialog: MatDialog) {
    this.dataSource = new SigningKeysDataSource(
      this.refresh$.asObservable().pipe(startWith(false))
    );
  }
  createKey() {
    this.matDialog.open(CreateSigningKeyDialogComponent, {
      disableClose: true,
    });
  }

  deleteKey(key: SigningKey) {
    key;
  }
}
