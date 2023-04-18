import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { Flow } from '@activepieces/shared';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  createFlow$: Observable<Flow>;
  constructor(private flowService: FlowService, private router: Router) {}
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
