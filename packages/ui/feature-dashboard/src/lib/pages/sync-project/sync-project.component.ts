import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncProjectDataSource } from './sync-project.datasource';
import { SyncProjectService } from '../../services/sync-project.service';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { ConfigureRepoDialogComponent } from '../../components/dialogs/configure-repo-dialog/configure-repo-dialog.component';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-sync-project',
  templateUrl: './sync-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncProjectComponent {
  displayedColumns = ['remoteUrl', 'branch', 'updated', 'action'];
  dataSource: SyncProjectDataSource;
  refreshTable$ = new BehaviorSubject<true>(true);
  dialogOpened$?: Observable<boolean>;
  constructor(
    private syncProjectService: SyncProjectService,
    private store: Store,
    private matDialog: MatDialog
  ) {
    this.dataSource = new SyncProjectDataSource(
      this.syncProjectService,
      this.store,
      this.refreshTable$.asObservable()
    );
  }
  configureNewRepo() {
    this.dialogOpened$ = this.matDialog
      .open(ConfigureRepoDialogComponent)
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refreshTable$.next(true);
          }
        })
      );
  }
}
