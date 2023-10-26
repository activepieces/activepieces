import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import {
  Flow,
  FlowOperationType,
  TelemetryEventName,
} from '@activepieces/shared';
import { FlowService, TelemetryService } from '@activepieces/ui/common';
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
  constructor(
    private router: Router,
    private flowService: FlowService,
    private telemetryService: TelemetryService
  ) {}

  createFlow() {
    if (!this.creatingFlow) {
      this.creatingFlow = true;
      localStorage.setItem('newFlow', 'true');
      this.createFlow$ = this.flowService
        .create({
          displayName: $localize`Untitled`,
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
          displayName: demoTemplate.displayName,
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
                  this.telemetryService.capture({
                    name: TelemetryEventName.DEMO_IMPORTED,
                    payload: {},
                  });
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
