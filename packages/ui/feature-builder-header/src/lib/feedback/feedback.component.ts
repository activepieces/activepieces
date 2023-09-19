import { ChangeDetectionStrategy, Component } from '@angular/core';
import { supportUrl } from '@activepieces/shared';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }
}
