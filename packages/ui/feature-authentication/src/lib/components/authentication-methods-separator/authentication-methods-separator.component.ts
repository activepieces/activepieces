import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlagService } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import {
  ThirdPartyAuthnProvidersToShowMap,
  ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared';
import { ApFlagId } from '@activepieces/shared';
@Component({
  selector: 'app-authentication-methods-separator',
  templateUrl: './authentication-methods-separator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationMethodsSeparatorComponent {
  readonly ThirdPartyAuthnProvider = ThirdPartyAuthnProviderEnum;
  loginsWithEmailEnabled$: Observable<boolean>;
  thirdPartyProvidersToShow$: Observable<ThirdPartyAuthnProvidersToShowMap>;
  constructor(private flagsService: FlagService) {
    this.loginsWithEmailEnabled$ = this.flagsService.isFlagEnabled(
      ApFlagId.EMAIL_AUTH_ENABLED
    );
    this.thirdPartyProvidersToShow$ =
      this.flagsService.getThirdPartyProvidersMap();
  }
}
