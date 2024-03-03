import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApFlagId, PopulatedFlow } from '@activepieces/shared';
import {
  PushToGitDialogComponent,
  PushToGitDialogData,
} from '../dialogs/push-to-git-dialog/push-to-git-dialog.component';
import { Observable, map, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import { Store } from '@ngrx/store';
import { FlagService, ProjectSelectors, flowActionsUiInfo } from '@activepieces/ui/common';
import { SyncProjectService } from '../../services/sync-project.service';
import { ConfigureRepoDialogComponent } from '../dialogs/configure-repo-dialog/configure-repo-dialog.component';

@Component({
  selector: 'app-push-flow-to-git-button',
  templateUrl: './push-flow-to-git-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushFlowToGitButtonComponent {
  readonly flowActionsUiInfo = flowActionsUiInfo;

  @Input({ required: true }) flow!: PopulatedFlow;

  
  gitRepo$: Observable<GitRepo | null>;
  openPushDialog$?: Observable<void>;
  openConfigureRepoDialog$?: Observable<GitRepo | null> ;
  show$: Observable<boolean>;
  constructor(
    private dialogService: MatDialog,
    private store: Store,
    private gitRepoService: SyncProjectService,
    private flagService: FlagService
  ) {
    this.show$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_GIT_SYNC);
    this.gitRepo$ = this.getGitRepo();
  }

  openPushDialog(): void {
    this.openPushDialog$ = this.store
      .select(ProjectSelectors.selectCurrentProject)
      .pipe(
        switchMap((project) => {
          return this.gitRepo$.pipe(
            tap((repo) => {
              const data: PushToGitDialogData = {
                flow: this.flow,
                projectName: project.displayName,
                repoId: repo!.id,
              };
              this.dialogService.open(PushToGitDialogComponent, {
                data,
              });
            }),
            map(() => void 0)
          );
        })
      );
  }

  openConfigureRepoDialog() {
   this.openConfigureRepoDialog$ = this.dialogService
      .open(ConfigureRepoDialogComponent)
      .afterClosed().pipe(tap(res=>{
        this.gitRepo$ = of(res);
        if(res)
        {
          this.openPushDialog();
         }
      })
      );
  }
  getGitRepo(){
    return this.store.select(ProjectSelectors.selectPlatform).pipe(
      take(1),
      switchMap((platform) => {
        if (!platform || !platform.gitSyncEnabled) {
          return of(null);
        }
        // TODO optmize this as it should run only once accross the flow table
        return this.gitRepoService.list().pipe(
          map((repos) => {
            if (repos.length === 0) {
              throw new Error('No git repo found');
            }
            return repos[0];
          }),
        );
      }),
      shareReplay(1)
    );
  }
}
