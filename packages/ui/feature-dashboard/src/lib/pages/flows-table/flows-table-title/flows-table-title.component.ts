import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, switchMap, take, tap } from 'rxjs';
import { PopulatedFlow, FolderDto } from '@activepieces/shared';
import { FoldersSelectors } from '../../../store/folders/folders.selector';
import { Store } from '@ngrx/store';
import {
  CURRENT_FLOW_IS_NEW_KEY_IN_LOCAL_STORAGE,
  FlowService,
  AuthenticationService,
} from '@activepieces/ui/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  currentFolder$: Observable<FolderDto | undefined>;
  createFlow$: Observable<PopulatedFlow>;
  showAllFlows$: Observable<boolean>;
  constructor(
    private store: Store,
    private flowService: FlowService,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
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
}
