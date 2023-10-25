import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DashboardService } from '@activepieces/ui/common';
import { Platform } from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-platform',
  templateUrl: './platform.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformComponent implements OnInit, OnDestroy {
  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute
  ) {}
  platform!: Platform;
  ngOnInit() {
    this.platform = this.route.snapshot.data['platform'];
    this.dashboardService.hideSideNavRoutes();
  }
  ngOnDestroy() {
    this.dashboardService.showSideNavRoutes();
  }
}
