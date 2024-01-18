import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TelemetryService } from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { TelemetryEventName } from '@activepieces/shared';
@Component({
  selector: 'app-billing-sidenav-item',
  templateUrl: './billing-sidenav-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingSidenavItemComponent {
  options = {
    path: '/assets/lottie/gift.json',
  };
  constructor(
    private router: Router,
    private telemetryService: TelemetryService
  ) {}
  openBillingPage() {
    this.telemetryService.capture({
      name: TelemetryEventName.OPENED_PRICING_FROM_DASHBOARD,
      payload: {
        location: 'sidenav',
      },
    });
    this.router.navigate(['/plans']);
  }
}
