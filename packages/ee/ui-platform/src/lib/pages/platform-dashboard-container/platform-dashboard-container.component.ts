import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DashboardService } from '@activepieces/ui/common';

@Component({
  selector: 'app-platform-dashboard-container',
  templateUrl: './platform-dashboard-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformDashboardContainerComponent implements OnInit, OnDestroy {
  constructor(private dashboardService: DashboardService) {}
  ngOnInit() {
    this.dashboardService.enteredPlatformModule();
  }
  ngOnDestroy() {
    this.dashboardService.leftPlatformModule();
  }
}
