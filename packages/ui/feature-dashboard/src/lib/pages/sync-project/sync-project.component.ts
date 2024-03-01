import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GitRepo, ProjectOperationType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GenericSnackbarTemplateComponent,
  ProjectSelectors,
} from '@activepieces/ui/common';
import { RepoResolverData } from '../../resolvers/repo.resolver';
import { Store } from '@ngrx/store';
import { Project } from '@activepieces/shared';
import {
  ConfigureRepoDialogComponent,
  PullFromGitDialogComponent,
  PullFromGitDialogData,
  SyncProjectService,
} from '@activepieces/ui-feature-git-sync';

@Component({
  selector: 'app-sync-project',
  templateUrl: './sync-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncProjectComponent {
  displayedColumns = ['remoteUrl', 'branch', 'updated', 'action'];
  dialogOpened$?: Observable<null | GitRepo>;
  currentRepo$ = new BehaviorSubject<null | GitRepo | undefined>(null);
  showUpgrade = false;
  disconnect$?: Observable<void>;
  currentProject$: Observable<Project>;
  openPullDialog$: Observable<void>;
  pullDialogLoading$ = new BehaviorSubject<boolean>(false);
  upgradeNote = $localize`Create external backups, environments, and maintain a version history all through your own managed Git repos.`;
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
          dryRun: false,
        })
        .pipe(
          tap((plan) => {
            this.pullDialogLoading$.next(false);
            const data: PullFromGitDialogData = {
              operations: plan.operations.map((op) => {
                switch (op.type) {
                  case ProjectOperationType.CREATE_FLOW:
                    return $localize`Create flow ${op.flow.displayName}`;
                  case ProjectOperationType.UPDATE_FLOW:
                    return $localize`Update flow ${op.flow.displayName}`;
                  case ProjectOperationType.DELETE_FLOW:
                    return $localize`Delete flow ${op.flow.displayName}`;
                }
              }),
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
