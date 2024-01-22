import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  Optional,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlagService, TelemetryService } from '@activepieces/ui/common';
import { ApEdition, TelemetryEventName } from '@activepieces/shared';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
export type UpgradeDialogData = {
  limitType: 'connections' | 'team';
  limit: number;
};

@Component({
  templateUrl: './upgrade-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeDialogComponent implements OnInit {
  teamNote$: Observable<string> | undefined;
  showUpgradeButton$: Observable<boolean> | undefined;
  options = {
    path: '/assets/lottie/rocket.json',
  };
  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: UpgradeDialogData,
    public telemetryService: TelemetryService,
    private router: Router,
    private flagService: FlagService,
    private matDialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.teamNote$ = this.flagService.getEdition().pipe(
      map((edition) => {
        switch (edition) {
          case ApEdition.CLOUD:
            return $localize`Upgrade`;
          case ApEdition.COMMUNITY:
          case ApEdition.ENTERPRISE:
            return $localize`Please contact your platform admin`;
        }
      })
    );
    this.showUpgradeButton$ = this.flagService.getEdition().pipe(
      map((edition) => {
        return edition === ApEdition.CLOUD;
      })
    );
    this.telemetryService.capture({
      name: TelemetryEventName.UPGRADE_POPUP,
      payload: {
        limit: this.data.limit,
        limitType: this.data.limitType,
      },
    });
  }

  openPlans() {
    this.telemetryService.capture({
      name: TelemetryEventName.UPGRADE_CLICKED,
      payload: {
        limit: this.data.limit,
        limitType: this.data.limitType,
      },
    });
    this.router.navigate(['/plans']);
    this.matDialog.closeAll();
  }

  openConnections() {
    this.router.navigate(['/connection']);
  }
}
