import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-upgrade-note',
  templateUrl: './upgrade-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeNoteComponent {
  @Input() pricingUrl = 'https://www.activepieces.com/pricing';
  @Input() docsLink = '';
  @Input({ required: true }) featureNote = '';
  openPricing() {
    window.open(this.pricingUrl, '_blank', 'noopener noreferrer');
  }
  openDocs() {
    window.open(this.docsLink, '_blank', 'noopener noreferrer');
  }
}
