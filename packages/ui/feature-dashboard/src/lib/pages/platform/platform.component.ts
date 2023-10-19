import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DashboardService } from '../../dashboard.service';

@Component({
  selector: 'app-platform',
  templateUrl: './platform.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformComponent implements OnInit, OnDestroy {
  constructor(private dashboardService: DashboardService) {}
  ngOnInit() {
    this.dashboardService.hideSideNavRoutes();
  }
  ngOnDestroy() {
    this.dashboardService.showSideNavRoutes();
  }
}
