import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FlagService } from '../service';
import { ApEdition } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';

export const showBasedOnEditionGuard: (
  allowedEditions: ApEdition[]
) => CanActivateFn = (allowedEditions) => {
  return (): Observable<boolean> => {
    const flagService = inject(FlagService);
    const router = inject(Router);
    return flagService.getEdition().pipe(
      map((res) => {
        return !!allowedEditions.find((ed) => ed === res);
      }),
      tap((res) => {
        if (!res) router.navigate(['/not-found']);
      })
    );
  };
};
