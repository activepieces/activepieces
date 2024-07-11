import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Platform } from '@activepieces/shared';
import { PlatformService } from '../service';

export const PLATFORM_RESOLVER_KEY = 'platform';
export const PlatformResolver: ResolveFn<Platform | null> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.getCurrentUserPlatform();
};
