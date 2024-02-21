import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, switchMap, take, tap } from 'rxjs';
import { PopulatedFlow, FolderDto, Project } from '@activepieces/shared';
import { FoldersSelectors } from '@activepieces/ui/feature-folders-store';
import { Store } from '@ngrx/store';
import {
  CURRENT_FLOW_IS_NEW_KEY_IN_LOCAL_STORAGE,
  FlowService,
  AuthenticationService,
  flowActionsUiInfo,
  ImportFlowDialogComponent,
  ImporFlowDialogData,
} from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProjectSelectors } from '@activepieces/ui/common-store';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  currentFolder$: Observable<FolderDto | undefined>;
  createFlow$?: Observable<PopulatedFlow>;
  showAllFlows$: Observable<boolean>;
  currentProject$: Observable<Project>;
  readonly flowActionsUiInfo = flowActionsUiInfo;
  constructor(
    private store: Store,
    private flowService: FlowService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private matDialog: MatDialog
  ) {
    this.currentProject$ = this.store.select(
      ProjectSelectors.selectCurrentProject
    );
    this.showAllFlows$ = this.store.select(
      FoldersSelectors.selectDisplayAllFlows
    );
    this.currentFolder$ = this.store.select(
      FoldersSelectors.selectCurrentFolder
    );
  }
  createFlow() {
    if (!this.createFlow$) {
      this.createFlow$ = this.currentFolder$.pipe(
        take(1),
        switchMap((res) => {
          return this.flowService
            .create({
              projectId: this.authenticationService.getProjectId(),
              displayName: $localize`Untitled`,
              folderId: res?.id,
            })
            .pipe(
              tap((flow) => {
                localStorage.setItem(
                  CURRENT_FLOW_IS_NEW_KEY_IN_LOCAL_STORAGE,
                  'true'
                );
                this.router.navigate(['/flows/', flow.id]);
              })
            );
        })
      );
    }
  }
  importFlow(projectId: string) {
    const data: ImporFlowDialogData = { projectId: projectId };
    this.matDialog.open(ImportFlowDialogComponent, { data });
  }
}
