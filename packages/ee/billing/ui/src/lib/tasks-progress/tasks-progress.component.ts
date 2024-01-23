import { ApFlagId, TelemetryEventName } from '@activepieces/shared';
import { FlagService, TelemetryService } from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { BillingService } from '../service/billing.service';

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
    perDay: boolean;
    customerPortalUrl: string;
  }>;
  billingEnabled$: Observable<boolean>;

  constructor(
    private router: Router,
    private telemetryService: TelemetryService,
    private billingService: BillingService,
    private flagsService: FlagService
  ) {
    this.billingEnabled$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_BILLING
    );
    this.tasksStats$ = this.billingService.getUsage().pipe(
      map((res) => {
        const perDay = !!res.plan.tasksPerDay;
        return {
          tasksCap: res.plan.tasksPerDay
            ? res.plan.tasksPerDay
            : res.plan.tasks,
          tasksExecuted: res.plan.tasksPerDay
            ? res.usage.consumedTasksToday
            : res.usage.consumedTasks,
          customerPortalUrl: res.customerPortalUrl,
          perDay,
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
