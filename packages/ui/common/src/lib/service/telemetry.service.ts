import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { ApEnvironment, User } from '@activepieces/shared';
import { FlagService } from '../service/flag.service';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  constructor(private flagService: FlagService) { }
  init(user: User) {
    if (user !== null && user !== undefined) {
      forkJoin({
        telemetry: this.flagService.isTelemetryEnabled(),
        currentVersion: this.flagService.getRelease(),
        environment: this.flagService.getEnvironment()
      }).subscribe((flags) => {
        if (flags.telemetry === true) {
          posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
            api_host: 'https://app.posthog.com',
            autocapture: false,
          });

          posthog.identify(user.id, {
            activepiecesVersion: flags.currentVersion,
            activepiecesEnvironment: flags.environment,
          });
        }
      });
    }
  }

  isFeatureEnabled(feature: string): Observable<boolean> {
    return forkJoin({
      environment: this.flagService.getEnvironment(),
      telemetryEnabled: this.flagService.isTelemetryEnabled(),
    }).pipe(
      map(({ environment, telemetryEnabled }) => {
        if (environment === ApEnvironment.DEVELOPMENT) {
          return false;
        }
        if (!telemetryEnabled) {
          return false;
        }
        return posthog.isFeatureEnabled(feature);
      })
    );
  }
  
}
