import { inject } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { FlagService } from '../service';
import { ApFlagId } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';

export const showPlatformSettingsGuard: () => Observable<boolean> = () => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const platformAdmin = authenticationService.isPlatformOwner();
  const flagsService = inject(FlagService);
  return flagsService.isFlagEnabled(ApFlagId.SHOW_PLATFORM_DEMO).pipe(
    map((isDemo) => isDemo || platformAdmin),
    tap((showPlatformSettings) => {
      if (!showPlatformSettings) {
        router.navigate(['/404']);
      }
    })
  );
};
