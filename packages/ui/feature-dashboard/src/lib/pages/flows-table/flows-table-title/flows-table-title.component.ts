import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, switchMap, take, tap } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { Flow, FolderDto } from '@activepieces/shared';
import { FoldersSelectors } from '../../../store/folders/folders.selector';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  createFlow$: Observable<Flow>;
  currentFolder$: Observable<FolderDto | undefined>;
  showAllFlows$: Observable<boolean>;
  constructor(
    private flowService: FlowService,
    private router: Router,
    private store: Store
  ) {
    this.showAllFlows$ = this.store.select(
      FoldersSelectors.selectDisplayAllFlows
    );
    this.currentFolder$ = this.store.select(
      FoldersSelectors.selectCurrentFolder
    );
  }
  createFlow() {
    if (!this.creatingFlow) {
      this.creatingFlow = true;
      this.createFlow$ = this.store
        .select(FoldersSelectors.selectCurrentFolder)
        .pipe(
          take(1),
          switchMap((res) => {
            return this.flowService
              .create({
                displayName: 'Untitled',
                folderId: res?.id,
              })
              .pipe(
                tap((flow) => {
                  this.router.navigate(['/flows/', flow.id], {
                    queryParams: { newFlow: true },
                  });
                })
              );
          })
        );
    }
  }
}
