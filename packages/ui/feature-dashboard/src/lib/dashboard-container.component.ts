import { Component } from '@angular/core';
import {
  AuthenticationService,
  EmbeddingService,
  showPlatformDashboard$,
} from '@activepieces/ui/common';
import {
  DashboardService,
  FlagService,
  environment,
} from '@activepieces/ui/common';
import { Observable, combineLatest, map } from 'rxjs';
import { ApFlagId, Project } from '@activepieces/shared';

import { Router } from '@angular/router';

@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent {
  environment = environment;
  isEmbedded$: Observable<boolean>;
  showSidnav$: Observable<boolean>;
  isInPlatformRoute$: Observable<boolean>;
  currentProject$: Observable<Project>;
  showPoweredByAp$: Observable<boolean>;
  showPlatform$: Observable<boolean>;
  showAdminConsoleLock$: Observable<boolean>;
  constructor(
    private flagService: FlagService,
    private embeddedService: EmbeddingService,
    private dashboardService: DashboardService,
    private authenticationService: AuthenticationService,
    public router: Router
  ) {
    this.showPlatform$ = showPlatformDashboard$(
      this.authenticationService,
      this.flagService
    );
    this.showPoweredByAp$ = combineLatest({
      showPoweredByAp: this.flagService.isFlagEnabled(
        ApFlagId.SHOW_POWERED_BY_AP
      ),
      isInPlatformRoute: this.dashboardService.getIsInPlatformRoute(),
    }).pipe(
      map((res) => {
        return !res.isInPlatformRoute && res.showPoweredByAp;
      })
    );

    this.isEmbedded$ = this.embeddedService.getIsInEmbedding$();
    this.showSidnav$ = this.embeddedService
      .getState$()
      .pipe(map((state) => !state.hideSideNav));
    this.isInPlatformRoute$ = this.dashboardService.getIsInPlatformRoute();
    this.showAdminConsoleLock$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_PLATFORM_DEMO
    );
  }

  navigateToAdminConsole() {
    this.router.navigate(['/platform']);
  }

  navigateToProjectDashboard() {
    this.router.navigate(['/']);
  }
}
