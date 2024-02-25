import { ApFlagId, TelemetryEventName } from '@activepieces/shared';
import {
  FlagService,
  ProjectSelectors,
  TelemetryService,
} from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tasks-progress',
  templateUrl: './tasks-progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: [],
})
export class TasksProgressComponent {
  tasksStats$: Observable<{
    tasksCap: number;
    tasksExecuted: number;
  }>;
  billingEnabled$: Observable<boolean>;

  constructor(
    private router: Router,
    private telemetryService: TelemetryService,
    private flagsService: FlagService,
    private store: Store
  ) {
    this.billingEnabled$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_BILLING
    );
    this.tasksStats$ = this.store.select(ProjectSelectors.selectTaskProgress);
  }

  openPricingPlans() {
    this.telemetryService.capture({
      name: TelemetryEventName.OPENED_PRICING_FROM_DASHBOARD,
      payload: {
        location: 'tasks-progress',
      },
    });
    this.router.navigate(['/plans']);
  }
}
