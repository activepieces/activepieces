import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { map, Observable } from 'rxjs';
import { UsageService } from '@ee/usage/frontend/usage.service';

@Component({
  selector: 'app-runs-left-snackbar',
  templateUrl: './runs-left-snackbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsLeftSnackbarComponent {
  runsStats$: Observable<{ runsCap: number, runsExecuted: number, daysLeftBeforeReset: number }>;
  constructor(
    public snackBarRef: MatSnackBarRef<RunsLeftSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private usageService: UsageService
  ) {
    this.runsStats$ = this.usageService.getUsage().pipe(map(res => {
      return {
        runsCap: res.metrics.steps.remaining + res.metrics.steps.consumed,
        runsExecuted: res.metrics.steps.consumed,
        daysLeftBeforeReset: Math.ceil(res.metrics.steps.nextResetInMs / 24 / 60 / 60 / 1000)
      }
    }));
  }

  openPricingPlans() {
    window.open("https://www.activepieces.com/pricing", "_blank");
  }
}
