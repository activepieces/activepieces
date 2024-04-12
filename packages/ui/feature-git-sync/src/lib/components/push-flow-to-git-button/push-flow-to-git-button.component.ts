import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopulatedFlow } from '@activepieces/shared';
import {
  PushToGitDialogComponent,
  PushToGitDialogData,
} from '../dialogs/push-to-git-dialog/push-to-git-dialog.component';
import { Observable, map, switchMap, tap } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import { SyncProjectService } from '../../services/sync-project.service';
import { ProjectService, flowActionsUiInfo } from '@activepieces/ui/common';
import { AsyncPipe } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatMenuItem } from '@angular/material/menu';

@Component({
  selector: 'app-push-flow-to-git-button',
  templateUrl: './push-flow-to-git-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatMenuItem,
    AngularSvgIconModule,
    AsyncPipe,
  ],
})
export class PushFlowToGitButtonComponent {
  readonly flowActionsUiInfo = flowActionsUiInfo;

  @Input({ required: true }) flow!: PopulatedFlow;


  openPushDialog$?: Observable<void>;
  openConfigureRepoDialog$?: Observable<GitRepo | null>;
  show$: Observable<boolean>;
  constructor(
    private dialogService: MatDialog,
    private projectService: ProjectService,
    private gitRepoService: SyncProjectService,
  ) {
    this.show$ = this.gitRepoService.isDevelopment()
  }

  openPushDialog(): void {
    this.openPushDialog$ = this.projectService.currentProject$
      .pipe(
        switchMap((project) => {
          return this.gitRepoService.get().pipe(
            tap((repo) => {
              const data: PushToGitDialogData = {
                flow: this.flow,
                projectName: project!.displayName,
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


}
