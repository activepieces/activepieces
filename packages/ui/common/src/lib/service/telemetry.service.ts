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

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  constructor(private flagService: FlagService) {}
  init(user: User) {
    if (user !== null && user !== undefined) {
      this.flagService.getAllFlags().subscribe((flags) => {
        if (flags[ApFlagId.TELEMETRY_ENABLED] === true) {
          posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
            api_host: 'https://track.activepieces.com',
            ui_host: 'app.posthog.com',
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
          return false;
        }
        if (!flags[ApFlagId.TELEMETRY_ENABLED]) {
          return false;
        }
        return posthog.isFeatureEnabled(feature);
      })
    );
  }
}
