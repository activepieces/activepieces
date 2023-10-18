import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import {
  ApEnvironment,
  ApFlagId,
  TelemetryEvent,
  User,
} from '@activepieces/shared';
import { FlagService } from '../service/flag.service';
import { Observable, map, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';
import { productFruits } from 'product-fruits';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  productFruitsInitialized = false;
  constructor(
    private flagService: FlagService,
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}
  init(user: User) {
    if (user !== null && user !== undefined) {
      this.flagService.getAllFlags().subscribe((flags) => {
        if (flags[ApFlagId.TELEMETRY_ENABLED] === true) {
          posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
            autocapture: false,
          });
          const currentVersion =
            (flags[ApFlagId.CURRENT_VERSION] as string) || '0.0.0';
          const environment =
            (flags[ApFlagId.ENVIRONMENT] as string) || '0.0.0';

          posthog.identify(user.id, {
            activepiecesVersion: currentVersion,
            activepiecesEnvironment: environment,
          });
          this.initializePf(user);
        }
      });
    }
  }

  capture(event: TelemetryEvent) {
    this.flagService
      .getAllFlags()
      .pipe(take(1))
      .subscribe((flags) => {
        if (flags[ApFlagId.TELEMETRY_ENABLED] === true) {
          posthog.capture(event.name, event.payload);
        }
      });
  }

  isFeatureEnabled(feature: string): Observable<boolean> {
    return this.flagService.getAllFlags().pipe(
      map((flags) => {
        if (flags[ApFlagId.ENVIRONMENT] === ApEnvironment.DEVELOPMENT) {
          return true;
        }
        if (!flags[ApFlagId.TELEMETRY_ENABLED]) {
          return false;
        }
        return posthog.isFeatureEnabled(feature) || false;
      })
    );
  }
  savePiecesSearch(request: {
    search: string;
    target: 'steps' | 'triggers' | 'both';
    insideTemplates: boolean;
  }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/C6khe7pYMdiLPrBpVIWZg',
      {
        ...request,
        email: this.authService.currentUser.email,
      }
    );
  }

  // BEGIN EE
  initializePf(user: User) {
    if (!this.productFruitsInitialized) {
      productFruits.init(
        'cLCwk9nBPS1DBBiE',
        'en',
        {
          username: user.id,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          signUpAt: user.created,
        },
        { disableLocationChangeDetection: false }
      );
      productFruits.safeExec(($pf) => {
        console.log('PF is Initialized');
        this.productFruitsInitialized = true;
      });
    }
  }
  // END EE
}
