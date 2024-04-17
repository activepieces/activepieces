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
  isVersionMatch,
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
  @ViewChild('contactSalesSlideout') contactSalesSlideout: MatSidenav;
  contactSalesState$: Observable<boolean>;
  currentVersion$?: Observable<string>;
  latestVersion$?: Observable<string>;
  isVersionMatch$?: Observable<boolean>;

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

    this.contactSalesState$ = this.contactSalesService.contactSalesState$;

    this.currentVersion$ = this.flagService.getStringFlag(
      ApFlagId.CURRENT_VERSION
    );
    this.latestVersion$ = this.flagService.getStringFlag(
      ApFlagId.LATEST_VERSION
    );
    this.isVersionMatch$ = combineLatest({
      currentVersion: this.currentVersion$,
      latestVersion: this.latestVersion$,
    }).pipe(
      map(({ currentVersion, latestVersion }) => {
        return isVersionMatch(latestVersion, currentVersion);
      })
    );
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
