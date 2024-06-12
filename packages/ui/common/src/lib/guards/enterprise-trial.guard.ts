import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FlagService } from '../service';
import { ApEdition } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';

export const enterpriseTrialGuard: () => CanActivateFn = () => {
  return (): Observable<boolean> => {
    const flagService = inject(FlagService);
    const router = inject(Router);
    return flagService.getEdition().pipe(
      map((res) => {
        switch (res) {
          case ApEdition.CLOUD:
            return window.location.origin === 'https://cloud.activepieces.com';
          case ApEdition.COMMUNITY:
            return true;
          case ApEdition.ENTERPRISE:
            return false;
        }
      }),
      tap((res) => {
        if (!res) router.navigate(['/not-found']);
      })
    );
  };
};
