import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ContactSalesService } from '../../service/contact-sales.service';
import { fadeIn400ms } from '../../animation/fade-in.animations';
import { FeatureKey } from '../../utils/consts';

@Component({
  selector: 'ap-upgrade-note',
  templateUrl: './upgrade-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class UpgradeNoteComponent {
  @Input({ required: true }) featureNoteTitle = '';
  @Input({ required: true }) featureNote = '';
  @Input() videoUrl = '';
  @Input({ required: true }) featureKey: FeatureKey;

  constructor(private contactSalesService: ContactSalesService) {}

  @Input() insideTab = false;

  openContactSales(): void {
    this.contactSalesService.open([this.featureKey]);
  }
}
