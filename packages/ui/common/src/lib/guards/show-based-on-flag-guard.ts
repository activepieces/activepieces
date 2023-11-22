import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { FlagService } from '../service';
import { ApFlagId } from '@activepieces/shared';
import { Observable } from 'rxjs';

type CanActivateFn = (ars: ActivatedRouteSnapshot, rss: RouterStateSnapshot) => Observable<boolean>;

export const showBasedOnFlagGuard: (flag: ApFlagId) => CanActivateFn = (flag: ApFlagId) => {

  return (ars: ActivatedRouteSnapshot, rss: RouterStateSnapshot): Observable<boolean> => {
    const flagService = inject(FlagService);

    return flagService.isFlagEnabled(flag);
  };
};