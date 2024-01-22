import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@activepieces/shared';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { FederatedAuthnProviderEnum } from './federated-authn-provider.enum';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';

@Component({
  selector: 'app-sso-settings',
  templateUrl: './sso-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class SsoSettingsComponent {
  platform$: BehaviorSubject<Platform>;
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  FederatedAuthnProviderEnum = FederatedAuthnProviderEnum;
  constructor(private route: ActivatedRoute) {
    const platform: Platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.platform$ = new BehaviorSubject(platform);
  }
  platformUpdated(platform: Platform) {
    this.platform$.next(platform);
  }
}
