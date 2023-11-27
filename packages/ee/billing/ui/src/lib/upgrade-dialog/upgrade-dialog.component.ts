import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  Optional,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TelemetryService } from '@activepieces/ui/common';
import { ProjectType, TelemetryEventName } from '@activepieces/shared';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
export type UpgradeDialogData = {
  limitType: 'connections' | 'team';
  limit: number;
  projectType: ProjectType;
};

@Component({
  templateUrl: './upgrade-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeDialogComponent implements OnInit {
  readonly ProjectType = ProjectType;
  readonly teamMemebersNotes = {
    [ProjectType.PLATFORM_MANAGED]: $localize`Please contact your platform admin`,
    [ProjectType.STANDALONE]: $localize`Upgrade`,
  };
  options = {
    path: '/assets/lottie/rocket.json',
  };
  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: UpgradeDialogData,
    public telemetryService: TelemetryService,
    private router: Router,
    private matDialog: MatDialog
  ) {}
  ngOnInit(): void {
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
