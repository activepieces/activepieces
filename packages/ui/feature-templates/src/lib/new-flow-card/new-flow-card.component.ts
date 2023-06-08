import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlowService } from '@activepieces/ui/common';
import { Observable, switchMap, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Flow, FolderId } from '@activepieces/shared';

@Component({
  selector: 'app-new-flow-card',
  templateUrl: './new-flow-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFlowCardComponent {
  createFlow$: Observable<Flow>;
  @Input() folderId$: Observable<FolderId | undefined>;
  constructor(private flowService: FlowService, private router: Router) {}
  createFlow() {
    if (!this.createFlow$) {
      this.createFlow$ = this.folderId$.pipe(
        take(1),
        switchMap((res) => {
          return this.flowService
            .create({
              displayName: 'Untitled',
              folderId: res,
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
