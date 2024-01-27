import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApFlagId, PopulatedFlow } from '@activepieces/shared';
import {
  PushDialogComponent,
  PushDialogData,
} from '../push-dialog/push-dialog.component';
import { Observable, map, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { GitRepo, PushSyncMode } from '@activepieces/ee-shared';
import { Store } from '@ngrx/store';
import { FlagService, ProjectSelectors } from '@activepieces/ui/common';
import { SyncProjectService } from '../services/sync-project.service';

@Component({
  selector: 'app-push-flow-button',
  templateUrl: './push-flow-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushFlowButtonComponent {
  @Input({ required: true }) flow!: PopulatedFlow;

  gitRepo$: Observable<GitRepo | null>;
  openDialog$: Observable<void> | undefined;
  show$: Observable<boolean>;
  constructor(
    private dialogService: MatDialog,
    private store: Store,
    private gitRepoService: SyncProjectService,
    private flagService: FlagService
  ) {
    this.show$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_GIT_SYNC);
    this.gitRepo$ = this.store.select(ProjectSelectors.selectPlatform).pipe(
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

  openDialog(): void {
    this.openDialog$ = this.store
      .select(ProjectSelectors.selectCurrentProject)
      .pipe(
        switchMap((project) => {
          return this.gitRepo$.pipe(
            tap((repo) => {
              const data: PushDialogData = {
                flow: this.flow,
                mode: PushSyncMode.FLOW,
                projectName: project.displayName,
                repoId: repo!.id,
              };
              this.dialogService.open(PushDialogComponent, {
                data,
              });
            }),
            map(() => void 0)
          );
        })
      );
  }
}
