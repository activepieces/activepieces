import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { Flow, FoldersListDto } from '@activepieces/shared';
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
  currentFolder$: Observable<FoldersListDto | undefined>;
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
      this.createFlow$ = this.flowService
        .create({
          displayName: 'Untitled',
        })
        .pipe(
          tap((flow) => {
            this.router.navigate(['/flows/', flow.id], {
              queryParams: { newCollection: true },
            });
          })
        );
    }
  }
}
