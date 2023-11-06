import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PlatformService } from './platform.service';
import { AuthenticationService } from '@activepieces/ui/common';
import { Platform } from '@activepieces/ee-shared';

export const platformResolver: ResolveFn<Platform | null> = () => {
  const platformService: PlatformService = inject(PlatformService);
  const authenticationService: AuthenticationService = inject(
    AuthenticationService
  );
  const decodedToken = authenticationService.getDecodedToken();
  if (!decodedToken) {
    console.error('Token is invalid or not available');
    return null;
  }
  return platformService.getPlatform(decodedToken['platformId']);
};
