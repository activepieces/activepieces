import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { FlagService } from '../service';
import { ApFlagId } from '@activepieces/shared';
import { Observable, tap } from 'rxjs';

export const showPlatformSettingsGuard: () => Observable<boolean> = () => {
  const router = inject(Router);
  const flagsService = inject(FlagService);
  return flagsService.isFlagEnabled(ApFlagId.SHOW_PLATFORM).pipe(
    tap((showPlatformSettings) => {
      if (!showPlatformSettings) {
        router.navigate(['/404']);
      }
    })
  );
};
