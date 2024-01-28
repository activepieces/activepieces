import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PlatformService, ProjectSelectors } from '@activepieces/ui/common';
import { AuthenticationService } from '@activepieces/ui/common';
import { Platform } from '@activepieces/ee-shared';
import { Store } from '@ngrx/store';
import { of, switchMap } from 'rxjs';
export const PLATFORM_RESOLVER_KEY = 'platform';
export const platformResolver: ResolveFn<Platform | null> = () => {
  const platformService: PlatformService = inject(PlatformService);
  const store: Store = inject(Store);
  const authenticationService: AuthenticationService = inject(
    AuthenticationService
  );
  const platformId = authenticationService.getPlatformId();
  if (!platformId) {
    return null;
  }

  const platform$ = platformService.getPlatform(platformId);
  return store.select(ProjectSelectors.selectPlatform).pipe(
    switchMap((platform) => {
      if (platform) {
        return of(platform);
      }
      return platform$;
    })
  );
};
