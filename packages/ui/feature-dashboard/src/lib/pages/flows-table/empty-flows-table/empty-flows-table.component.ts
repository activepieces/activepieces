import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { Flow, FlowOperationType } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { demoTemplate } from './demo-flow-template';

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
      localStorage.setItem('newFlow', 'true');
      this.createFlow$ = this.flowService
        .create({
          displayName: 'Untitled',
        })
        .pipe(
          tap((flow) => {
            localStorage.setItem('newFlow', 'true');
            this.router.navigate(['/flows/', flow.id]);
          })
        );
    }
  }

  openToDemo() {
    if (!this.creatingFlow) {
      this.creatingFlow = true;
      this.createFlow$ = this.flowService
        .create({
          displayName: 'Demo',
        })
        .pipe(
          switchMap((flow) => {
            return this.flowService
              .update(flow.id, {
                type: FlowOperationType.IMPORT_FLOW,
                request: demoTemplate,
              })
              .pipe(
                tap((updatedFlow: Flow) => {
                  this.router.navigate([
                    `/flows/${updatedFlow.id}?sampleFlow=true`,
                  ]);
                })
              );
          })
        );
    }
  }
}
