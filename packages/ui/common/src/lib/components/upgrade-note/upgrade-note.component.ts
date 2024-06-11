import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ContactSalesService } from '../../service/contact-sales.service';
import { fadeIn400ms } from '../../animation/fade-in.animations';
import { FeatureKey } from '../../utils/consts';
import { LicenseKeysService, FlagService } from '../../service';
import { Observable, map, of, switchMap } from 'rxjs';
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
  isTrialKeyActivated$: Observable<boolean> = of(false);
  constructor(
    private contactSalesService: ContactSalesService,
    private activationKeysService: LicenseKeysService,
    private flagService: FlagService
  ) {
    this.isCloud$ = this.flagService
      .getEdition()
      .pipe(map((res) => res === ApEdition.CLOUD));
    this.isTrialKeyActivated$ = this.flagService.getEdition().pipe(
      switchMap((res) => {
        if (res === ApEdition.COMMUNITY || res === ApEdition.CLOUD) {
          return of(false);
        }
        return this.activationKeysService
          .getPlatformKeyStatus()
          .pipe(map((res) => res.isTrial));
      })
    );
  }

  openContactSales(): void {
    this.contactSalesService.open([this.featureKey]);
  }

  openTrialDialog(): void {
    this.activationKeysService.openTrialDialog();
  }
}
