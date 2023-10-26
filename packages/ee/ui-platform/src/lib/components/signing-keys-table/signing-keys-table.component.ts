import { Component } from '@angular/core';
import {
  SigningKey,
  SigningKeysDataSource,
} from './signing-keys-table.datasource';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateSigningKeyDialogComponent } from './create-signing-key-dialog/create-signing-key-dialog.component';

@Component({
  selector: 'app-signing-keys-table',
  templateUrl: './signing-keys-table.component.html',
})
export class SigningKeysTableComponent {
  displayedColumns = ['displayName', 'created', 'action'];
  dataSource: SigningKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  constructor(private matDialog: MatDialog) {
    this.dataSource = new SigningKeysDataSource(this.refresh$);
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
