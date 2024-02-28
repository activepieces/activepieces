import {
  ApEdition,
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../environments/environment';

type FlagsMap = Record<string, boolean | string | object | undefined>;

@Injectable({
  providedIn: 'root',
})
export class FlagService {
  private flags$: Observable<FlagsMap> | undefined;

  constructor(private http: HttpClient) {}

  getAllFlags() {
    if (!this.flags$) {
      this.flags$ = this.initialiseFlags();
    }
    return this.flags$;
  }
  reinitialiseFlags() {
    this.flags$ = this.initialiseFlags();
  }
  private initialiseFlags() {
    return this.http
      .get<FlagsMap>(environment.apiUrl + '/flags')
      .pipe(shareReplay(1));
  }

  getStringFlag(flag: ApFlagId): Observable<string> {
    return this.getAllFlags().pipe(
      map((value) => {
        return value[flag] as string;
      })
    );
  }

  getArrayFlag(flag: ApFlagId): Observable<string[]> {
    return this.getAllFlags().pipe(
      map((value) => {
        return value[flag] as string[];
      })
    );
  }

  getThirdPartyProvidersMap() {
    return this.getAllFlags().pipe(
      map((res) => {
        return res[
          ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP
        ] as ThirdPartyAuthnProvidersToShowMap;
      })
    );
  }

  isFirstSignIn() {
    return this.getAllFlags().pipe(
      map((value) => {
        return !value[ApFlagId.USER_CREATED];
      })
    );
  }

  isSignedUpEnabled(): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((flags) => {
        const firstUser = flags['USER_CREATED'] as boolean;
        if (!firstUser && flags['EDITION'] !== ApEdition.CLOUD) {
          return true;
        }
        return flags['SIGN_UP_ENABLED'] as boolean;
      })
    );
  }

  isTelemetryEnabled(): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags['TELEMETRY_ENABLED'] as boolean;
      })
    );
  }

  getWebhookUrlPrefix(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.WEBHOOK_URL_PREFIX] as string;
      })
    );
  }

  getFormUrlPrefix(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return (flags[ApFlagId.FRONTEND_URL] as string) + '/forms';
      })
    );
  }

  isFlagEnabled(flag: ApFlagId): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((value) => {
        return value[flag] === true;
      })
    );
  }

  getEdition(): Observable<ApEdition> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.EDITION] as ApEdition;
      })
    );
  }

  getRelease(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.CURRENT_VERSION] as string;
      })
    );
  }

  getSandboxTimeout(): Observable<number> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return Number(flags[ApFlagId.SANDBOX_RUN_TIME_SECONDS]);
      })
    );
  }

  getEnvironment(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.ENVIRONMENT] as string;
      })
    );
  }

  getRedirectUrl(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] as string;
      })
    );
  }

  getFrontendUrl(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.FRONTEND_URL] as string;
      })
    );
  }

  getTheme() {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.THEME] as Record<string, any>;
      })
    );
  }

  getWebsiteName() {
    return this.getTheme().pipe(map((theme) => theme['websiteName']));
  }

  getLogos(): Observable<{
    fullLogoUrl: string;
    favIconUrl: string;
    logoIconUrl: string;
  }> {
    return this.getTheme().pipe(map((theme) => theme['logos']));
  }
  /**Colors like formlabel, borders,dividers ... etc */
  getColors(): Observable<Record<string, string | Record<string, string>>> {
    return this.getTheme().pipe(map((theme) => theme['colors']));
  }
  getWarnPalette(): Observable<
    Record<string, string | Record<string, string>>
  > {
    return this.getTheme().pipe(map((theme) => theme['materialWarnPalette']));
  }
  getPrimaryPalette(): Observable<
    Record<string, string | Record<string, string>>
  > {
    return this.getTheme().pipe(
      map((theme) => theme['materialPrimaryPalette'])
    );
  }
  getShowPoweredByAp(): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((flags) => flags[ApFlagId.SHOW_POWERED_BY_AP] as boolean)
    );
  }
}
