import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthenticationService, FlagService } from '@activepieces/ui/common';
import {
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/ee-shared';
import { Observable } from 'rxjs';

@Component({
  selector: 'ap-third-party-auth',
  templateUrl: './third-party-auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThirdPartyAuthComponent {
  readonly ThirdPartyAuthnProvider = ThirdPartyAuthnProviderEnum;
  thirdPartyProvidersToShow$: Observable<ThirdPartyAuthnProvidersToShowMap>;
  constructor(
    private flagService: FlagService,
    private authenticationService: AuthenticationService
  ) {
    this.thirdPartyProvidersToShow$ =
      this.flagService.getThirdPartyProvidersMap();
  }
  signInWithProvider(provider: ThirdPartyAuthnProviderEnum) {
    this.authenticationService.signInWithThirdPartyProvider(provider);
  }
}
