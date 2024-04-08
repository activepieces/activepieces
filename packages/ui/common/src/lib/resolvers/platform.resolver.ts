import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Platform } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { of, take, switchMap } from 'rxjs';
import { AuthenticationService, PlatformService } from '../service';
import { ProjectSelectors } from '../store';
export const PLATFORM_RESOLVER_KEY = 'platform';
export const PlatformResolver: ResolveFn<Platform | null> = () => {
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
    take(1),
    switchMap((platform) => {
      if (platform) {
        return of(platform);
      }
      return platform$;
    })
  );
};
