import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { FlagService } from '../service';
import { ApFlagId } from '@activepieces/shared';
import { Observable, forkJoin, map } from 'rxjs';

export const showBasedIfAnyOfFlag: (flags: ApFlagId[]) => CanActivateFn = (
  flags: ApFlagId[]
) => {
  return (): Observable<boolean> => {
    const flagService = inject(FlagService);

    return forkJoin(flags.map((flag) => flagService.isFlagEnabled(flag))).pipe(
      map((flags) => flags.some((flag) => flag))
    );
  };
};
