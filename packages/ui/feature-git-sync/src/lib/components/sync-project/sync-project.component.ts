import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, shareReplay, switchMap, tap } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AuthenticationService,
  GenericSnackbarTemplateComponent,
  PlatformService,
  ProjectSelectors,
  UiCommonModule,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { ProjectWithLimits } from '@activepieces/shared';
import { SyncProjectService } from '../../services/sync-project.service';
import { ConfigureRepoDialogComponent } from '../dialogs/configure-repo-dialog/configure-repo-dialog.component';
import { PullFromGitDialogComponent, PullFromGitDialogData } from '../dialogs/pull-from-git-dialog/pull-from-git-dialog.component';
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
  currentRepo$: Observable<GitRepo | undefined>;
  showUpgrade$: Observable<boolean>;
  disconnect$?: Observable<void>;
  currentProject$: Observable<ProjectWithLimits>;
  openPullDialog$: Observable<void> | undefined;
  refresh$ = new BehaviorSubject<void>(undefined);
  pullDialogLoading$ = new BehaviorSubject<boolean>(false);
  upgradeNoteTitle = $localize`Unlock Git Sync`;
  upgradeNote = $localize`Streamline your team's workflow for a seamless experience to build and deploy flows across your environments`;
  configureButtonTooltip = $localize`Upgrade to enable`;
  constructor(
    private matDialog: MatDialog,
    private syncProjectService: SyncProjectService,
    private snackbar: MatSnackBar,
    private platformService: PlatformService,
    private authenticationService: AuthenticationService,
    private store: Store
  ) {
    this.currentProject$ = this.store.select(
      ProjectSelectors.selectCurrentProject
    );

    this.showUpgrade$ = this.platformService.getPlatform(this.authenticationService.getPlatformId()!).pipe(
      map((p) => {
        return !p.gitSyncEnabled;
      }))
    this.currentRepo$ = this.refresh$.pipe(
      switchMap(() => this.syncProjectService.get()),
      shareReplay(1)
    );
  }
  configureNewRepo() {
    this.dialogOpened$ = this.matDialog
      .open(ConfigureRepoDialogComponent)
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refresh$.next();
          }
        })
      );
  }

  disconnect() {
    this.disconnect$ = this.currentRepo$.pipe(switchMap((repo) => {
      const gitRepo = repo!;
      return this.syncProjectService.disconnect(gitRepo.id)
        .pipe(
          tap(() => {
            this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
              data: $localize`Disconnected from  <b>${gitRepo.remoteUrl}</b>`,
            });
            this.refresh$.next();
          })
        )
    }));
  }

  pull() {
    if (this.pullDialogLoading$.value) {
      return;
    }
    this.pullDialogLoading$.next(true);
    this.openPullDialog$ = this.currentRepo$.pipe(
      map((repo) => repo!.id),
      switchMap((repoId) => {
        return this.syncProjectService.pull(repoId, {
          dryRun: true,
        }).pipe(
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
      }),
    )
  }
}
