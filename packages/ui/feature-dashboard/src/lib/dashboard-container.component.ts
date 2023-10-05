import { Component } from '@angular/core';
import { FlagService, environment } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';

@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent {
  environment = environment;
  showCommunity$: Observable<boolean>;

  constructor(private flagService: FlagService) {
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
