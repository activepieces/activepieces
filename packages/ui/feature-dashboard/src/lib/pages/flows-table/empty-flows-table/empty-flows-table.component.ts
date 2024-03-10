import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import {
  Flow,
  FlowOperationType,
  TelemetryEventName,
} from '@activepieces/shared';
import {
  FlagService,
  FlowService,
  TelemetryService,
  AuthenticationService,
} from '@activepieces/ui/common';
import { demoTemplate } from './demo-flow-template';

@Component({
  selector: 'app-empty-flows-table',
  templateUrl: './empty-flows-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyFlowsTableComponent {
  creatingDemo = false;
  openToDemo$: Observable<Flow>;
  showPoweredByAp$: Observable<boolean>;
  @Output() openTemplatesDialog = new EventEmitter();
  constructor(
    private router: Router,
    private flowService: FlowService,
    private telemetryService: TelemetryService,
    private flagService: FlagService,
    private authenticationService: AuthenticationService
  ) {
    this.showPoweredByAp$ = this.flagService.getShowPoweredByAp();
  }

  openToDemo() {
    if (!this.creatingDemo) {
      this.creatingDemo = true;
      this.openToDemo$ = this.flowService
        .create({
          projectId: this.authenticationService.getProjectId(),
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
