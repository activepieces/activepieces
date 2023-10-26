import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApFlagId, supportUrl } from '@activepieces/shared';
import { Observable } from 'rxjs';
import { FlagService } from '@activepieces/ui/common';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
  showSupport$: Observable<boolean>;

  constructor(private flagService: FlagService) {
    this.showSupport$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_COMMUNITY);
  }

  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }
}
