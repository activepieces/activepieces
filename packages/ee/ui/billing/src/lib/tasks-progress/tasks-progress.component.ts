import { ApFlagId, TelemetryEventName } from '@activepieces/shared';
import {
  FlagService,
  ProjectService,
  TelemetryService,
} from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

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
    private projectService: ProjectService,
    private flagsService: FlagService
  ) {
    this.billingEnabled$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_BILLING
    );
    this.tasksStats$ = this.projectService.currentProject$.pipe(
      map((project) => {
        return {
          tasksCap: project?.plan.tasks || 0,
          tasksExecuted: project?.usage.tasks || 0,
        };
      })
    );
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
