import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ContactSalesService } from '../../service/contact-sales.service';
import { fadeIn400ms } from '../../animation/fade-in.animations';
import { FeatureKey } from '../../utils/consts';
import { ActivationKeysService, FlagService } from '../../service';
import { Observable, map, of } from 'rxjs';
import { ApEdition } from '@activepieces/shared';

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
  @Input() insideTab = false;
  isCloud$: Observable<boolean>;
  //TODO: Actual implementation
  isTrialKeyActivated$: Observable<boolean> = of(false);
  constructor(
    private contactSalesService: ContactSalesService,
    private activationKeysService: ActivationKeysService,
    private flagService: FlagService
  ) {
    this.isCloud$ = this.flagService
      .getEdition()
      .pipe(map((res) => res === ApEdition.CLOUD));
  }

  openContactSales(): void {
    this.contactSalesService.open([this.featureKey]);
  }

  openTrialDialog(): void {
    this.activationKeysService.openTrialDialog();
  }
}
