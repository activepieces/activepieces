import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '@activepieces/ui/feature-folders-store';
import { NavigationService } from '@activepieces/ui/common';
import { Observable, map, of } from 'rxjs';
import { ApFlagId, supportUrl } from '@activepieces/shared';
import { DashboardService, FlagService } from '@activepieces/ui/common';

type SideNavRoute = {
  icon: string;
  caption: string;
  route: string;
  effect?: () => void;
  showInSideNav$: Observable<boolean>;
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
  showGitSync: Observable<boolean>;
  sideNavRoutes$: Observable<SideNavRoute[]>;
  mainDashboardRoutes: SideNavRoute[] = [];
  platformDashboardRoutes: SideNavRoute[] = [
    {
      icon: 'assets/img/custom/dashboard/projects.svg',
      caption: $localize`Projects`,
      route: 'platform/projects',
      showInSideNav$: of(true),
    },
    {
      icon: 'assets/img/custom/dashboard/appearance.svg',
      caption: $localize`Appearance`,
      route: 'platform/appearance',
      showInSideNav$: of(true),
    },
    {
      icon: 'assets/img/custom/dashboard/pieces.svg',
      caption: $localize`Pieces`,
      route: 'platform/pieces',
      showInSideNav$: of(true),
    },
    {
      icon: 'assets/img/custom/dashboard/templates.svg',
      caption: $localize`Templates`,
      route: 'platform/templates',
      showInSideNav$: of(true),
    },
    {
      icon: 'assets/img/custom/dashboard/users.svg',
      caption: $localize`Users`,
      route: 'platform/users',
      showInSideNav$: of(true),
    },

    {
      icon: 'assets/img/custom/dashboard/settings.svg',
      caption: $localize`Settings`,
      route: 'platform/settings',
      showInSideNav$: of(true),
    },
  ];
  constructor(
    public router: Router,
    private store: Store,
    private flagServices: FlagService,
    private cd: ChangeDetectorRef,
    private dashboardService: DashboardService,
    private navigationService: NavigationService
  ) {
    this.showGitSync = flagServices.isFlagEnabled(ApFlagId.SHOW_GIT_SYNC);
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
      },
      {
        icon: 'assets/img/custom/dashboard/runs.svg',
        caption: $localize`Runs`,
        route: 'runs',
        showInSideNav$: of(true),
      },
      {
        icon: 'assets/img/custom/dashboard/activity.svg',
        caption: $localize`Activity`,
        route: 'activity',
        showInSideNav$: this.flagServices.isFlagEnabled(
          ApFlagId.SHOW_ACTIVITY_LOG
        ),
      },
      {
        icon: 'assets/img/custom/dashboard/connections.svg',
        caption: $localize`Connections`,
        route: 'connections',
        showInSideNav$: of(true),
      },
      {
        icon: 'assets/img/custom/dashboard/members.svg',
        caption: $localize`Team`,
        route: 'team',
        showInSideNav$: of(true),
      },

      {
        icon: 'assets/img/custom/dashboard/settings.svg',
        caption: $localize`Settings`,
        route: 'settings',
        showInSideNav$: this.showGitSync,
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
          return this.mainDashboardRoutes;
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

  markChange() {
    this.cd.detectChanges();
  }

  public isActive(route: string) {
    return this.router.url.includes(route);
  }

  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }
}
