import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/shared';
import { PlatformService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sso-settings',
  templateUrl: './sso-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class SsoSettingsComponent {
  platform$: Observable<Platform>;
  isLocked$: Observable<boolean>;
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  ThirdPartyAuthnProviderEnum = ThirdPartyAuthnProviderEnum;
  upgradeNoteTitle = $localize`Enable Single Sign On`;
  upgradeNote = $localize`Let your users sign in with your current SSO provider or give them self serve sign up access`;

  constructor(private platformService: PlatformService) {
    this.platform$ = this.platformService.currentPlatformNotNull();
    this.isLocked$ = this.platformService.ssoSettingsDisabled();
  }
}
