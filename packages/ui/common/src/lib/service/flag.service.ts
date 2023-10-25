import { ApEdition, ApFlagId } from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../environments/environment';

type FlagsMap = Record<string, boolean | string | object | undefined>;

@Injectable({
  providedIn: 'root',
})
export class FlagService {
  flags$: Observable<FlagsMap> | undefined;

  constructor(private http: HttpClient) {}

  getAllFlags() {
    if (!this.flags$) {
      this.flags$ = this.http
        .get<FlagsMap>(environment.apiUrl + '/flags')
        .pipe(shareReplay(1));
    }
    return this.flags$;
  }

  isFirstSignIn() {
    return this.getAllFlags().pipe(
      map((value) => {
        return !value['USER_CREATED'];
      })
    );
  }

  isSignedUpEnabled(): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((flags) => {
        const firstUser = flags['USER_CREATED'] as boolean;
        if (!firstUser) {
          return true;
        }
        return flags['SIGN_UP_ENABLED'] as boolean;
      })
    );
  }

  isChatbotEnabled(): Observable<boolean> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags['CHATBOT_ENABLED'] as boolean;
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

  getFrontendUrl(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.FRONTEND_URL] as string;
      })
    );
  }

  getTemplatesSourceUrl(): Observable<string> {
    return this.getAllFlags().pipe(
      map((flags) => {
        return flags[ApFlagId.TEMPLATES_SOURCE_URL] as string;
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
}
