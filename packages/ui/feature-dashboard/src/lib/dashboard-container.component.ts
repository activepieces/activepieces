import { Component } from '@angular/core';
import {
  DashboardService,
  FlagService,
  ProjectSelectors,
  environment,
} from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { ApFlagId, Project } from '@activepieces/shared';
import { Store } from '@ngrx/store';

@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent {
  environment = environment;
  showCommunity$: Observable<boolean>;
  isInPlatformRoute$: Observable<boolean>;
  currentProject$: Observable<Project>;
  constructor(
    private flagService: FlagService,
    private dashboardService: DashboardService,
    private store: Store
  ) {
    this.showCommunity$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.isInPlatformRoute$ = this.dashboardService.getIsInPlatformRoute();
    this.currentProject$ = this.store.select(
      ProjectSelectors.selectCurrentProject
    );
  }
  showWhatIsNew() {
    window.open(
      'https://community.activepieces.com/c/announcements',
      '_blank',
      'noopener'
    );
  }
}
