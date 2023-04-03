import { ApEdition, ApFlagId } from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../environment';

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

  getWarningMessage(): Observable<
    { title?: string; body?: string } | undefined
  > {
    return this.getAllFlags().pipe(
      map((flags) => {
        const warningTitle: string | undefined = flags[
          'WARNING_TEXT_HEADER'
        ] as string | undefined;
        const warningBody: string | undefined = flags['WARNING_TEXT_BODY'] as
          | string
          | undefined;
        if (warningTitle || warningBody) {
          return {
            title: warningTitle,
            body: warningBody,
          };
        }
        return undefined;
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
}
