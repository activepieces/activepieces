import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FlagService } from '@activepieces/ui/common';
import { ApFlagId } from '@activepieces/shared';
import { Observable } from 'rxjs';
export const PLATFORM_DEMO_RESOLVER_KEY = 'platformDemo';
export const isPlatformDemoResolver: ResolveFn<Observable<boolean>> = () => {
  const flagService: FlagService = inject(FlagService);
  return flagService.isFlagEnabled(ApFlagId.SHOW_PLATFORM_DEMO);
};
