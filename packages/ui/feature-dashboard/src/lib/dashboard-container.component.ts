import { Component, ViewChild } from '@angular/core';
import {
  AuthenticationService,
  EmbeddingService,
  showPlatformDashboard$,
  ContactSalesService,
  PlatformService,
} from '@activepieces/ui/common';
import {
  DashboardService,
  FlagService,
  environment,
} from '@activepieces/ui/common';
import { Observable, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { Project } from '@activepieces/shared';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { IssuesService } from './services/issues.service';

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
  isVersionMatch$?: Observable<boolean>;
  newUpdateMessage = $localize`New update available`;
  issuesCountCheck$: Observable<number>;
  constructor(
    private flagService: FlagService,
    private embeddedService: EmbeddingService,
    private dashboardService: DashboardService,
    private authenticationService: AuthenticationService,
    private platformService: PlatformService,
    public router: Router,
    private contactSalesService: ContactSalesService,
    private issuesService: IssuesService
  ) {
    this.contactSalesState$ =
      this.contactSalesService.contactSalesState.asObservable();
    this.showPlatform$ = showPlatformDashboard$(
      this.authenticationService,
      this.flagService
    );
    this.showPoweredByAp$ = combineLatest({
      showPoweredByAp: this.platformService.showPoweredByAp(),
      isInPlatformRoute: this.dashboardService.getIsInPlatformRoute(),
    }).pipe(
      map((res) => {
        return !res.isInPlatformRoute && res.showPoweredByAp;
      })
    );
    this.issuesCountCheck$ = this.platformService.issuesDisabled().pipe(
      switchMap((res) => {
        if (!res) {
          return this.issuesService.shouldRefreshIssuesCount$.pipe(
            switchMap(() => {
              return this.issuesService.getIssuesCount();
            }),
            tap((res) => {
              this.issuesService.toggleShowIssuesNotificationIconInSidebar(
                res > 0
              );
            })
          );
        }
        return of(0);
      })
    );
    this.isEmbedded$ = this.embeddedService.getIsInEmbedding$();
    this.showSidnav$ = this.embeddedService
      .getState$()
      .pipe(map((state) => !state.hideSideNav));
    this.isInPlatformRoute$ = this.dashboardService.getIsInPlatformRoute();
    this.isVersionMatch$ = this.flagService.isVersionMatch();
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
