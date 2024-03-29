import { Component, ViewChild } from '@angular/core';
import {
  AuthenticationService,
  EmbeddingService,
  showPlatformDashboard$,
  ContactSalesService,
} from '@activepieces/ui/common';
import {
  DashboardService,
  FlagService,
  environment,
} from '@activepieces/ui/common';
import { Observable, combineLatest, map } from 'rxjs';
import { ApFlagId, Project } from '@activepieces/shared';

import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

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
  @ViewChild('contactSalesSlideout') contactSalesSlideout: MatSidenav;

  contactSalesState$: Observable<boolean>;

  constructor(
    private flagService: FlagService,
    private embeddedService: EmbeddingService,
    private dashboardService: DashboardService,
    private authenticationService: AuthenticationService,
    public router: Router,
    private contactSalesService: ContactSalesService
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

    this.contactSalesState$ = this.contactSalesService.contactSalesState$;
  }

  navigateToAdminConsole() {
    this.router.navigate(['/platform']);
  }

  navigateToProjectDashboard() {
    this.router.navigate(['/']);
  }

  closeContactSalesSlideout() {
    this.contactSalesService.close();
  }
}
