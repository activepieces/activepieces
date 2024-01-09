import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigureRepoDialogComponent } from '../../components/dialogs/configure-repo-dialog/configure-repo-dialog.component';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  of,
  tap,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GitRepo } from '@activepieces/ee-shared';
import { SyncProjectService } from '../../services/sync-project.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GenericSnackbarTemplateComponent,
  ProjectSelectors,
} from '@activepieces/ui/common';
import { RepoResolverData } from '../../resolvers/repo.resolver';
import { Store } from '@ngrx/store';
import { Project } from '@activepieces/shared';
import {
  PushDialogComponent,
  PushDialogData,
} from '../../components/dialogs/push-dialog/push-dialog.component';
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
  push$?: Observable<void>;
  pull$?: Observable<void>;
  pushLoading$ = new Subject<boolean>();
  pullLoading$ = new Subject<boolean>();
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

  private errorHandlerPipe = (obs: Observable<void>) =>
    obs.pipe(
      catchError((err) => {
        console.error(err);
        this.snackbar.open(
          $localize`Error occured, please check your console`,
          '',
          {
            panelClass: 'error',
          }
        );
        return of(void 0);
      }),
      tap(() => {
        this.pushLoading$.next(false);
        this.pullLoading$.next(false);
      })
    );
  push(projectDisplayName: string) {
    const repoId = this.currentRepo$.value?.id;
    if (repoId) {
      const data: PushDialogData = {
        projectName: projectDisplayName,
        repoId: repoId,
      };
      this.matDialog
        .open(PushDialogComponent, {
          data,
        })
        .afterClosed();
    }
  }

  pull() {
    this.pullLoading$.next(true);
    const repoId = this.currentRepo$.value?.id;
    if (repoId) {
      this.pull$ = this.syncProjectService.pull(repoId).pipe(
        tap(() => {
          this.snackbar.open('Pulled successfully');
          window.location.reload();
        }),
        this.errorHandlerPipe.bind(this)
      );
    }
  }
}
