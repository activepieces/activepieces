import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Platform } from '@activepieces/shared';
import { AuthenticationService, PlatformService } from '../service';

export const PLATFORM_RESOLVER_KEY = 'platform';
export const PlatformResolver: ResolveFn<Platform | null> = () => {
  const platformService: PlatformService = inject(PlatformService);
  const authenticationService: AuthenticationService = inject(
    AuthenticationService
  );
  const platformId = authenticationService.getPlatformId();
  if (!platformId) {
    return null;
  }

  return platformService.getPlatform(platformId);
};
