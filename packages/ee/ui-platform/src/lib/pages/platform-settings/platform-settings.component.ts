import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-platform-settings',
  templateUrl: './platform-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformSettingsComponent {
  title = $localize`Settings`;
  platformId = '';
  readonly signingKeys = $localize`Signing Keys`;
  readonly termsAndPrivacy = $localize`Privacy & Terms`;
  readonly message = $localize`Please set the following TXT and CNAME records in your DNS provider, then click verify to confirm your control over the domain.`;
}
