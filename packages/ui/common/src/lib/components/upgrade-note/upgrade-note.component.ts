import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { fadeIn400ms } from '../../animation/fade-in.animations';

@Component({
  selector: 'ap-upgrade-note',
  templateUrl: './upgrade-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class UpgradeNoteComponent {
  @Input() pricingUrl = 'https://www.activepieces.com/sales';
  @Input() docsLink = '';
  @Input({ required: true }) featureNoteTitle = '';
  @Input({ required: true }) featureNote = '';
  @Input() videoUrl = '';
  @Input() insideTab = false;
  openPricing() {
    window.open(this.pricingUrl, '_blank', 'noopener noreferrer');
  }
  openDocs() {
    window.open(this.docsLink, '_blank', 'noopener noreferrer');
  }
}
