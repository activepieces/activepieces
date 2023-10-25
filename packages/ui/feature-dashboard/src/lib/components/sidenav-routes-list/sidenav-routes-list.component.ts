import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '../../store/folders/folders.actions';
import { Observable, map, tap } from 'rxjs';
import { ApFlagId, supportUrl } from '@activepieces/shared';
import { DashboardService, FlagService } from '@activepieces/ui/common';

type SideNavRoute = {
  icon: string;
  caption: string;
  route: string;
  effect?: () => void;
};

@Component({
  selector: 'app-sidenav-routes-list',
  templateUrl: './sidenav-routes-list.component.html',
  styleUrls: ['./sidenav-routes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavRoutesListComponent implements OnInit {
  removeChatbots$: Observable<void>;
  logoUrl$: Observable<string>;
  showSupport$: Observable<boolean>;
  showDocs$: Observable<boolean>;
  showBilling$: Observable<boolean>;
  hideSideRoutes$: Observable<boolean>;
  constructor(
    public router: Router,
    private store: Store,
    private flagServices: FlagService,
    private cd: ChangeDetectorRef,
    private dashboardService: DashboardService
  ) {
    this.logoUrl$ = this.flagServices
      .getLogos()
      .pipe(map((logos) => logos.logoIconUrl));
  }
  ngOnInit(): void {
    this.removeChatbots$ = this.flagServices.isChatbotEnabled().pipe(
      tap((res) => {
        if (!res) {
          this.sideNavRoutes = this.sideNavRoutes.filter(
            (route) => route.route !== 'chatbots'
          );
        }
      }),
      map(() => void 0)
    );
    this.showDocs$ = this.flagServices.isFlagEnabled(ApFlagId.SHOW_DOCS);
    this.showSupport$ = this.flagServices.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.showBilling$ = this.flagServices.isFlagEnabled(ApFlagId.SHOW_BILLING);
    this.hideSideRoutes$ = this.dashboardService.gethideSideNaveRoutesObs();
  }

  sideNavRoutes: SideNavRoute[] = [
    {
      icon: 'assets/img/custom/dashboard/flows.svg',
      caption: $localize`Flows`,
      route: 'flows',
      effect: () => {
        this.store.dispatch(FolderActions.showAllFlows());
      },
    },
    {
      icon: 'assets/img/custom/dashboard/chatbots.svg',
      caption: 'Chatbots',
      route: 'chatbots',
    },
    {
      icon: 'assets/img/custom/dashboard/runs.svg',
      caption: $localize`Runs`,
      route: 'runs',
    },
    {
      icon: 'assets/img/custom/dashboard/connections.svg',
      caption: $localize`Connections`,
      route: 'connections',
    },
    {
      icon: 'assets/img/custom/dashboard/members.svg',
      caption: $localize`Team`,
      route: 'team',
    },
  ];

  openDocs() {
    window.open('https://activepieces.com/docs', '_blank', 'noopener');
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank', 'noopener');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
    }
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
