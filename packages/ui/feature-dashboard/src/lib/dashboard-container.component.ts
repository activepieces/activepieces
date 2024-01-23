import { Component } from '@angular/core';
import { EmbeddingService } from '@activepieces/ui/common';
import {
  DashboardService,
  FlagService,
  ProjectSelectors,
  environment,
} from '@activepieces/ui/common';
import { Observable, combineLatest, map } from 'rxjs';
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
  isEmbedded$: Observable<boolean>;
  showSidnav$: Observable<boolean>;
  isInPlatformRoute$: Observable<boolean>;
  currentProject$: Observable<Project>;
  showPoweredByAp$: Observable<boolean>;
  constructor(
    private flagService: FlagService,
    private embeddedService: EmbeddingService,
    private dashboardService: DashboardService,
    private store: Store
  ) {
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
