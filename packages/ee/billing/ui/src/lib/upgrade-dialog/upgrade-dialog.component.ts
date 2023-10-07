import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  Optional,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TelemetryService } from '@activepieces/ui/common';
import { TelemetryEventName } from '@activepieces/shared';

type Data = {
  limitType: 'connections';
  limit: number;
};

@Component({
  templateUrl: './upgrade-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeDialogComponent implements OnInit {
  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: Data,
    public telemetryService: TelemetryService
  ) {}
  ngOnInit(): void {
    this.telemetryService.capture({
      name: TelemetryEventName.UPGRADE_POPUP,
      payload: {
        limit: this.data.limitType,
      },
    });
  }

  options = {
    path: '/assets/lottie/rocket.json',
  };

  openPlans() {
    this.telemetryService.capture({
      name: TelemetryEventName.UPGRADE_CLICKED,
      payload: {
        limit: this.data.limitType,
      },
    });
    window.open('/plans', '_blank');
  }

  openConnections() {
    window.open('/connections', '_blank');
  }
}
