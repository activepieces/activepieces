import { CanActivateFn, Router } from '@angular/router';
import { FlagService } from './service/flag.service';
import { inject } from '@angular/core';
import { ApEdition } from '@activepieces/shared';
import { map, tap } from 'rxjs';
export const isEeEditionGuard: CanActivateFn = () => {
  const flagService = inject(FlagService);
  const router = inject(Router);
  return flagService.getEdition().pipe(
    map((ed: ApEdition) => ed === ApEdition.ENTERPRISE || true),
    tap((res) => (!res ? router.navigate(['/404']) : null))
  );
};
