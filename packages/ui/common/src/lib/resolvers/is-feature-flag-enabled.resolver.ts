import { ResolveFn } from '@angular/router';
import { ApFlagId } from '@activepieces/shared';
import { FlagService } from '../service';
import { inject } from '@angular/core';

export const isFeatureFlagEnabledResolver = (flag: ApFlagId) => {
  const resolver: ResolveFn<boolean> = () => {
    const flagService: FlagService = inject(FlagService);
    return flagService.isFlagEnabled(flag);
  };
  return resolver;
};
