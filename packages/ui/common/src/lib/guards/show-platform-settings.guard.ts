import { inject } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { FlagService } from '../service';
import { Observable, tap } from 'rxjs';
import { showPlatformDashboard$ } from '../utils/consts';

export const showPlatformSettingsGuard: () => Observable<boolean> = () => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const flagsService = inject(FlagService);
  const shouldShouldPlatformDashboard$ = showPlatformDashboard$(
    authenticationService,
    flagsService
  );
  return shouldShouldPlatformDashboard$.pipe(
    tap((showPlatformSettings) => {
      if (!showPlatformSettings) {
        router.navigate(['/404']);
      }
    })
  );
};
