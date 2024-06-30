import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '@activepieces/ui/feature-folders-store';
import {
  AuthenticationService,
  EmbeddingService,
  NavigationService,
  PlatformService,
  UiCommonModule,
} from '@activepieces/ui/common';
import { Observable, forkJoin, map, of, take } from 'rxjs';
import { ApFlagId, ProjectMemberRole, supportUrl } from '@activepieces/shared';
import { DashboardService, FlagService } from '@activepieces/ui/common';
import {
  SideNavRoute,
  SidenavRouteItemComponent,
} from '../sidenav-route-item/sidenav-route-item.component';
import { CommonModule } from '@angular/common';
import { IssuesService } from '../../services/issues.service';

@Component({
  selector: 'app-sidenav-routes-list',
  templateUrl: './sidenav-routes-list.component.html',
  styleUrls: ['./sidenav-routes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SidenavRouteItemComponent, CommonModule, UiCommonModule],
})
export class SidenavRoutesListComponent implements OnInit {
  logoUrl$: Observable<string>;
  sideNavRoutes$: Observable<SideNavRoute[]>;
  mainDashboardRoutes: SideNavRoute[] = [];
  skipLocationChange$: Observable<boolean> =
    this.embeddingService.getSkipLocationChange$();

  isVersionMatch$?: Observable<boolean>;
  readonly supportRoute: SideNavRoute = {
    caption: 'Support',
    icon: 'assets/img/custom/support.svg',
    route: undefined,
    showInSideNav$: this.flagServices.isFlagEnabled(ApFlagId.SHOW_COMMUNITY),
    showLock$: of(false),
    effect: () => {
      this.openSupport();
    },
  };
  readonly docsRoute: SideNavRoute = {
    caption: 'Docs',
    icon: 'assets/img/custom/dashboard/documentation.svg',
    route: undefined,
    showInSideNav$: this.flagServices.isFlagEnabled(ApFlagId.SHOW_DOCS),
    showLock$: of(false),
    effect: () => {
      this.openDocs();
    },
  };
  platformDashboardRoutes: SideNavRoute[] = [];
  constructor(
    public router: Router,
    private store: Store,
    private flagServices: FlagService,
    private dashboardService: DashboardService,
    private navigationService: NavigationService,
    private embeddingService: EmbeddingService,
    private platformService: PlatformService,
    private authenticationService: AuthenticationService,
    private flagService: FlagService,
    private issuesService: IssuesService
  ) {
    this.logoUrl$ = this.flagServices
      .getLogos()
      .pipe(map((logos) => logos.logoIconUrl));
    this.isVersionMatch$ = this.flagService.isVersionMatch();

    this.platformDashboardRoutes = [
      {
        icon: 'assets/img/custom/dashboard/projects.svg',
        caption: $localize`Projects`,
        route: 'platform/projects',
        showInSideNav$: of(true),
        showLock$: this.platformService.manageProjectsDisabled(),
      },
      {
        icon: 'assets/img/custom/dashboard/appearance.svg',
        caption: $localize`Appearance`,
        route: 'platform/appearance',
        showInSideNav$: of(true),
        showLock$: this.platformService.customAppearanceDisabled(),
      },
      {
        icon: 'assets/img/custom/dashboard/pieces.svg',
        caption: $localize`Pieces`,
        route: 'platform/pieces',
        showInSideNav$: of(true),
        showLock$: this.platformService.managePiecesDisabled(),
      },
      {
        icon: 'assets/img/custom/dashboard/templates.svg',
        caption: $localize`Templates`,
        route: 'platform/templates',
        showInSideNav$: of(true),
        showLock$: this.platformService.manageTemplatesDisabled(),
      },
      {
        icon: 'assets/img/custom/dashboard/users.svg',
        caption: $localize`Users`,
        route: 'platform/users',
        showInSideNav$: of(true),
        showLock$: of(false),
      },
      {
        icon: 'assets/img/custom/dashboard/settings.svg',
        caption: $localize`Settings`,
        route: 'platform/settings',
        showInSideNav$: of(true),
        showLock$: of(false),
        showNotification$: this.isVersionMatch$,
      },
    ];
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
        showNotification$:
          this.issuesService.shouldShowIssuesNotificationIconInSidebarObs$,
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
        showInSideNav$: this.embeddingService.getIsInEmbedding$().pipe(
          take(1),
          map((isInEmbedding) => !isInEmbedding)
        ),
        showLock$: this.platformService.projectRolesDisabled(),
      },
      {
        icon: 'assets/img/custom/dashboard/settings.svg',
        caption: $localize`Settings`,
        route: 'settings',
        showInSideNav$: this.embeddingService.getIsInEmbedding$().pipe(
          take(1),
          map((isInEmbedding) => !isInEmbedding)
        ),
        showLock$: of(false),
      },
    ];
  }
  ngOnInit(): void {
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
  redirectHome(openInNewWindow: boolean) {
    this.navigationService.navigate({
      route: ['/flows'],
      openInNewWindow,
    });
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
          roleCondition: of(true),
          flagCondition: route.showInSideNav$,
        }).pipe(
          map(
            (conditions) => conditions.roleCondition && conditions.flagCondition
          )
        ),
      };
    });
  }
}
