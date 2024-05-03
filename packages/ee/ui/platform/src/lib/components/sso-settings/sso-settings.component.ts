import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Platform } from '@activepieces/shared';
import { PlatformService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { FederatedAuthnProviderEnum } from './federated-authn-provider.enum';

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
  FederatedAuthnProviderEnum = FederatedAuthnProviderEnum;
  upgradeNoteTitle = $localize`Enable Single Sign On`;
  upgradeNote = $localize`Let your users sign in with your current SSO provider or give them self serve sign up access`;

  constructor(private platformService: PlatformService) {
    this.platform$ = this.platformService.currentPlatformNotNull();
    this.isLocked$ = this.platformService.ssoSettingsDisabled();
  }
}
