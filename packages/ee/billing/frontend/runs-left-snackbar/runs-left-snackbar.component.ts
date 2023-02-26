import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { map, Observable } from 'rxjs';
import { BillingService } from '@ee/billing/frontend/billing.service';

@Component({
  selector: 'app-runs-left-snackbar',
  templateUrl: './runs-left-snackbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls:['./runs-left-snackbar.component.scss']
})
export class RunsLeftSnackbarComponent {
  runsStats$: Observable<{ runsCap: number, runsExecuted: number, daysLeftBeforeReset: number, customerPortalUrl : string }>;
  constructor(
    public snackBarRef: MatSnackBarRef<RunsLeftSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private billingService: BillingService
  ) {
    this.runsStats$ = this.billingService.getUsage().pipe(map(res => {
      return {
        runsCap: res.plan.tasks,
        runsExecuted: res.usage.consumedTasks,
        daysLeftBeforeReset: Math.round((new Date(res.usage.nextResetDatetime ).getTime() - Date.now()) / 1000 / 60 / 60 / 24),
        customerPortalUrl: res.customerPortalUrl
      }
    }));
  }

  openPricingPlans(portalUrl: string) {
    window.open(portalUrl, "_blank");
  }
}
