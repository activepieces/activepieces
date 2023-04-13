import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Flow } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';

@Component({
  selector: 'app-empty-flows-table',
  templateUrl: './empty-flows-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyFlowsTableComponent {
  creatingFlow = false;
  createFlow$: Observable<Flow>;
  constructor(private router: Router, private flowService: FlowService) {}

  createFlow() {
    if (!this.creatingFlow) {
      this.creatingFlow = true;
      this.createFlow$ = this.flowService
        .create({
          displayName: 'Untitled Flow',
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
