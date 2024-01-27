import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GitRepo, PushSyncMode } from '@activepieces/ee-shared';
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
  PullDialogComponent,
  PullDialogData,
  PushDialogComponent,
  PushDialogData,
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
  push(projectDisplayName: string) {
    const repoId = this.currentRepo$.value?.id;
    if (repoId) {
      const data: PushDialogData = {
        projectName: projectDisplayName,
        repoId: repoId,
        mode: PushSyncMode.PROJECT,
      };
      this.matDialog
        .open(PushDialogComponent, {
          data,
        })
        .afterClosed();
    }
  }

  pull(projectDisplayName: string) {
    const repoId = this.currentRepo$.value?.id;
    if (repoId) {
      const data: PullDialogData = {
        projectName: projectDisplayName,
        repoId: repoId,
      };
      this.matDialog
        .open(PullDialogComponent, {
          data,
        })
        .afterClosed();
    }
  }
}
