import { Component } from '@angular/core';
import { FlagService, environment } from '@activepieces/ui/common';
import { Observable, map } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
import { EmbeddingService } from '@activepieces/ee-components';

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
  constructor(
    private flagService: FlagService,
    private embeddedService: EmbeddingService
  ) {
    this.isEmbedded$ = this.embeddedService.getIsInEmbedding$();
    this.showSidnav$ = this.embeddedService
      .getState$()
      .pipe(map((state) => !state.hideSideNav));

    this.showCommunity$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
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
