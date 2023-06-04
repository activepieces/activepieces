import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlowService } from '@activepieces/ui/common';
import { Observable, switchMap, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { FoldersSelectors } from '../../../../store/folders/folders.selector';
import { Store } from '@ngrx/store';
import { Flow } from '@activepieces/shared';

@Component({
  selector: 'app-new-flow-card',
  templateUrl: './new-flow-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFlowCardComponent {
  createFlow$: Observable<Flow>;
  constructor(
    private flowService: FlowService,
    private router: Router,
    private store: Store
  ) {}
  createFlow() {
    if (!this.createFlow$) {
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
