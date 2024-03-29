import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ContactSalesService,
  FeatureKey,
} from '../../service/contact-sales.service';

@Component({
  selector: 'ap-upgrade-note',
  templateUrl: './upgrade-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeNoteComponent {
  @Input() pricingUrl = 'https://www.activepieces.com/sales';
  @Input() docsLink = '';
  @Input({ required: true }) featureNoteTitle = '';
  @Input({ required: true }) featureNote = '';
  @Input() videoUrl = '';
  @Input() featureKey: FeatureKey;

  constructor(private contactSalesService: ContactSalesService) {}

  openPricing() {
    this.openContactSales();
  }

  openDocs() {
    window.open(this.docsLink, '_blank', 'noopener noreferrer');
  }

  openContactSales(): void {
    this.contactSalesService.open([this.featureKey]);
  }
}
