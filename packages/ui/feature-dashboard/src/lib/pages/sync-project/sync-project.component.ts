import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigureRepoDialogComponent } from '../../components/dialogs/configure-repo-dialog/configure-repo-dialog.component';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GitRepo } from '@activepieces/ee-shared';

@Component({
  selector: 'app-sync-project',
  templateUrl: './sync-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncProjectComponent {
  displayedColumns = ['remoteUrl', 'branch', 'updated', 'action'];
  refreshTable$ = new BehaviorSubject<true>(true);
  dialogOpened$?: Observable<boolean>;
  currentRepo?: GitRepo;
  constructor(
    private matDialog: MatDialog,
    private activatedRoute: ActivatedRoute
  ) {
    this.currentRepo = this.activatedRoute.snapshot.data['repo'];
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
