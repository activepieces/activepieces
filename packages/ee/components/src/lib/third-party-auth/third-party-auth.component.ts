import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  AuthenticationService,
  FlagService,
  RedirectService,
} from '@activepieces/ui/common';
import {
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { Observable, map, switchMap, tap } from 'rxjs';
import { Oauth2Service } from '@activepieces/ui/feature-connections';

@Component({
  selector: 'ap-third-party-auth',
  templateUrl: './third-party-auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThirdPartyAuthComponent {
  readonly ThirdPartyAuthnProvider = ThirdPartyAuthnProviderEnum;
  readonly signUpText = $localize`Sign up with`;
  readonly signInText = $localize`Sign in with`;
  @Input()
  isForSignup = false;
  thirdPartyProvidersToShow$: Observable<ThirdPartyAuthnProvidersToShowMap>;
  signInWithThirdPartyProvider$: Observable<void> | undefined;
  constructor(
    private flagService: FlagService,
    private authenticationService: AuthenticationService,
    private oauth2Service: Oauth2Service,
    private redirectService: RedirectService
  ) {
    this.thirdPartyProvidersToShow$ =
      this.flagService.getThirdPartyProvidersMap();
  }
  signInWithThirdPartyProvider(provider: ThirdPartyAuthnProviderEnum) {
    this.signInWithThirdPartyProvider$ = this.flagService.getRedirectUrl().pipe(
      switchMap((redirectUrl) => {
        return this.authenticationService.getThirdPartyLoginUrl(provider).pipe(
          switchMap((response) => {
            return this.oauth2Service
              .openPopupWithLoginUrl(response.loginUrl, redirectUrl)
              .pipe(
                switchMap((popupResponse) => {
                  return this.authenticationService
                    .claimThirdPartyRequest({
                      providerName: provider,
                      code: popupResponse.code,
                    })
                    .pipe(
                      tap((response) => {
                        if (popupResponse && response.body) {
                          this.authenticationService.saveUser(
                            response.body,
                            response.body.token
                          );
                          this.redirectService.redirect();
                        }
                      }),
                      map(() => {
                        return void 0;
                      })
                    );
                })
              );
          })
        );
      })
    );
  }
}
