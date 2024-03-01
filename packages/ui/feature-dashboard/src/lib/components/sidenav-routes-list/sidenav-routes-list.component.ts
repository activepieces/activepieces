import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '@activepieces/ui/feature-folders-store';
import {
  AuthenticationService,
  NavigationService,
  PlatformService,
} from '@activepieces/ui/common';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ApFlagId, ProjectMemberRole, supportUrl } from '@activepieces/shared';
import { DashboardService, FlagService } from '@activepieces/ui/common';
import { isGitSyncLocked } from '../../resolvers/repo.resolver';

type SideNavRoute = {
  icon: string;
  caption: string;
  route: string;
  effect?: () => void;
  showInSideNav$: Observable<boolean>;
  showLock$: Observable<boolean>;
};

@Component({
  selector: 'app-sidenav-routes-list',
  templateUrl: './sidenav-routes-list.component.html',
  styleUrls: ['./sidenav-routes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavRoutesListComponent implements OnInit {
  logoUrl$: Observable<string>;
  showSupport$: Observable<boolean>;
  showDocs$: Observable<boolean>;
  showBilling$: Observable<boolean>;
  sideNavRoutes$: Observable<SideNavRoute[]>;
  mainDashboardRoutes: SideNavRoute[] = [];
  demoPlatform$: Observable<boolean> = this.flagService.isFlagEnabled(
    ApFlagId.SHOW_PLATFORM_DEMO
  );
  platformDashboardRoutes: SideNavRoute[] = [
    {
      icon: 'assets/img/custom/dashboard/projects.svg',
      caption: $localize`Projects`,
      route: 'platform/projects',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },
    {
      icon: 'assets/img/custom/dashboard/appearance.svg',
      caption: $localize`Appearance`,
      route: 'platform/appearance',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },
    {
      icon: 'assets/img/custom/dashboard/pieces.svg',
      caption: $localize`Pieces`,
      route: 'platform/pieces',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },
    {
      icon: 'assets/img/custom/dashboard/templates.svg',
      caption: $localize`Templates`,
      route: 'platform/templates',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },
    {
      icon: 'assets/img/custom/dashboard/users.svg',
      caption: $localize`Users`,
      route: 'platform/users',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },

    {
      icon: 'assets/img/custom/dashboard/settings.svg',
      caption: $localize`Settings`,
      route: 'platform/settings',
      showInSideNav$: of(true),
      showLock$: this.demoPlatform$,
    },
  ];
  constructor(
    public router: Router,
    private store: Store,
    private flagServices: FlagService,
    private dashboardService: DashboardService,
    private navigationService: NavigationService,
    private authenticationService: AuthenticationService,
    private platformService: PlatformService,
    private flagService: FlagService
  ) {
    this.logoUrl$ = this.flagServices
      .getLogos()
      .pipe(map((logos) => logos.logoIconUrl));
    this.mainDashboardRoutes = [
      {
        icon: 'assets/img/custom/dashboard/flows.svg',
        caption: $localize`Flows`,
        route: 'flows',
        effect: () => {
          this.store.dispatch(FolderActions.showAllFlows());
        },
        showInSideNav$: of(true),
        showLock$: of(false),
      },
      {
        icon: 'assets/img/custom/dashboard/runs.svg',
        caption: $localize`Runs`,
        route: 'runs',
        showInSideNav$: of(true),
        showLock$: of(false),
      },
      {
        icon: 'assets/img/custom/dashboard/activity.svg',
        caption: $localize`Activity`,
        route: 'activity',
        showInSideNav$: this.flagServices.isFlagEnabled(
          ApFlagId.SHOW_ACTIVITY_LOG
        ),
        showLock$: of(false),
      },
      {
        icon: 'assets/img/custom/dashboard/connections.svg',
        caption: $localize`Connections`,
        route: 'connections',
        showInSideNav$: of(true),
        showLock$: of(false),
      },
      {
        icon: 'assets/img/custom/dashboard/members.svg',
        caption: $localize`Team`,
        route: 'team',
        showInSideNav$: of(true),
        showLock$: this.flagService
          .isFlagEnabled(ApFlagId.PROJECT_MEMBERS_ENABLED)
          .pipe(map((enabled) => !enabled)),
      },

      {
        icon: 'assets/img/custom/dashboard/settings.svg',
        caption: $localize`Settings`,
        route: 'settings',
        showInSideNav$: this.flagServices.isFlagEnabled(ApFlagId.SHOW_GIT_SYNC),
        showLock$: isGitSyncLocked(
          this.flagServices,
          this.platformService,
          this.authenticationService.getPlatformId()
        ),
      },
    ];
  }
  ngOnInit(): void {
    this.showDocs$ = this.flagServices.isFlagEnabled(ApFlagId.SHOW_DOCS);
    this.showSupport$ = this.flagServices.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.showBilling$ = this.flagServices.isFlagEnabled(ApFlagId.SHOW_BILLING);
    this.sideNavRoutes$ = this.dashboardService.getIsInPlatformRoute().pipe(
      map((isInPlatformDashboard) => {
        if (!isInPlatformDashboard) {
          return this.filterRoutesBasedOnRole(
            this.authenticationService.currentUser.projectRole,
            this.mainDashboardRoutes
          );
        }
        return this.platformDashboardRoutes;
      })
    );
  }

  openDocs() {
    window.open('https://activepieces.com/docs', '_blank', 'noopener');
  }
  redirectHome(newWindow: boolean) {
    this.navigationService.navigate('/flows', newWindow);
  }

  public isActive(route: string) {
    return this.router.url.includes(route);
  }

  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }

  private filterRoutesBasedOnRole(
    role: ProjectMemberRole | null | undefined,
    routes: SideNavRoute[]
  ): SideNavRoute[] {
    return routes.map((route) => {
      return {
        ...route,
        showInSideNav$: forkJoin({
          roleCondition: this.isRouteAllowedForRole(role, route.route),
          flagCondition: route.showInSideNav$,
        }).pipe(
          map(
            (conditions) => conditions.roleCondition && conditions.flagCondition
          )
        ),
      };
    });
  }

  private isRouteAllowedForRole(
    role: ProjectMemberRole | null | undefined,
    route: string
  ) {
    if (role === undefined || role === null) {
      return of(true);
    }
    switch (role) {
      case ProjectMemberRole.ADMIN:
      case ProjectMemberRole.EDITOR:
      case ProjectMemberRole.VIEWER:
        return of(true);
      case ProjectMemberRole.EXTERNAL_CUSTOMER:
        return of(route === 'connections' || route === 'activity');
    }
  }
}
