import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, switchMap, take, tap } from 'rxjs';
import { Flow, FolderDto } from '@activepieces/shared';
import { FoldersSelectors } from '../../../store/folders/folders.selector';
import { Store } from '@ngrx/store';
import { FlowService } from '@activepieces/ui/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  currentFolder$: Observable<FolderDto | undefined>;
  createFlow$: Observable<Flow>;
  showAllFlows$: Observable<boolean>;
  constructor(
    private store: Store,
    private flowService: FlowService,
    private router: Router
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
              displayName: $localize`Untitled`,
              folderId: res?.id,
            })
            .pipe(
              tap((flow) => {
                localStorage.setItem('newFlow', 'true');
                this.router.navigate(['/flows/', flow.id]);
              })
            );
        })
      );
    }
  }
}
