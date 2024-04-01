import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ContactSalesService,
  FeatureKey,
} from '../../service/contact-sales.service';
import { fadeIn400ms } from '../../animation/fade-in.animations';

@Component({
  selector: 'ap-upgrade-note',
  templateUrl: './upgrade-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class UpgradeNoteComponent {
  @Input() docsLink = '';
  @Input({ required: true }) featureNoteTitle = '';
  @Input({ required: true }) featureNote = '';
  @Input() videoUrl = '';
  @Input() featureKey: FeatureKey;

  constructor(private contactSalesService: ContactSalesService) {}

  @Input() insideTab = false;

  openDocs() {
    window.open(this.docsLink, '_blank', 'noopener noreferrer');
  }

  openContactSales(): void {
    this.contactSalesService.open([this.featureKey]);
  }
}
