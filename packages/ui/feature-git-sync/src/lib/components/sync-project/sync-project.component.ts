import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GitRepo } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GenericSnackbarTemplateComponent,
  ProjectSelectors,
  UiCommonModule,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { ProjectWithLimits } from '@activepieces/shared';
import { SyncProjectService } from '../../services/sync-project.service';
import { ConfigureRepoDialogComponent } from '../dialogs/configure-repo-dialog/configure-repo-dialog.component';
import { PullFromGitDialogComponent, PullFromGitDialogData } from '../dialogs/pull-from-git-dialog/pull-from-git-dialog.component';
import { RepoResolverData } from '../../resolver/repo.resolver';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-sync-project',
  templateUrl: './sync-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ConfigureRepoDialogComponent,
    PullFromGitDialogComponent,
    AsyncPipe,
    UiCommonModule
  ],
})
export class SyncProjectComponent {
  displayedColumns = ['remoteUrl', 'branch', 'updated', 'action'];
  dialogOpened$?: Observable<null | GitRepo>;
  currentRepo$ = new BehaviorSubject<null | GitRepo | undefined>(null);
  showUpgrade = false;
  disconnect$?: Observable<void>;
  currentProject$: Observable<ProjectWithLimits>;
  openPullDialog$: Observable<void> | undefined;
  pullDialogLoading$ = new BehaviorSubject<boolean>(false);
  upgradeNoteTitle = $localize`Unlock Git Sync`;
  upgradeNote = $localize`Streamline your team's workflow for a seamless experience to build and deploy flows across your environments`;
  configureButtonTooltip = $localize`Upgrade to enable`;
  constructor(
    private matDialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private syncProjectService: SyncProjectService,
    private snackbar: MatSnackBar,
    private store: Store
  ) {
    this.currentProject$ = this.store.select(
      ProjectSelectors.selectCurrentProject
    );
    const data = this.activatedRoute.snapshot.data as {
      repo: RepoResolverData;
    };
    this.showUpgrade = data.repo.showUpgrade;
    if (!this.showUpgrade) {
      this.configureButtonTooltip = '';
    }
    this.currentRepo$.next(data.repo.repo);
  }
  configureNewRepo() {
    this.dialogOpened$ = this.matDialog
      .open(ConfigureRepoDialogComponent)
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.currentRepo$.next(res);
          }
        })
      );
  }

  disconnect() {
    if (this.currentRepo$.value) {
      this.disconnect$ = this.syncProjectService
        .disconnect(this.currentRepo$.value.id)
        .pipe(
          tap(() => {
            this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
              data: $localize`Disconnected from  <b>${this.currentRepo$.value?.remoteUrl}</b>`,
            });
            this.currentRepo$.next(null);
          })
        );
    }
  }

  pull() {
    const repoId = this.currentRepo$.value?.id;
    if (repoId) {
      if (this.pullDialogLoading$.value) {
        return;
      }
      this.pullDialogLoading$.next(true);
      this.openPullDialog$ = this.syncProjectService
        .pull(repoId, {
          dryRun: true,
        })
        .pipe(
          tap((plan) => {
            if (plan.operations.length === 0) {
              this.snackbar.open($localize`No changes to pull`);
              this.pullDialogLoading$.next(false);
              return;
            }
            this.pullDialogLoading$.next(false);
            const data: PullFromGitDialogData = {
              operations: plan.operations,
              repoId: repoId,
            };
            this.matDialog
              .open(PullFromGitDialogComponent, {
                data,
              })
              .afterClosed();
          }),
          map(() => void 0)
        );
    }
  }
}
