import { inject } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';

export const showPlatformSettingsGuard: () => boolean = () => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const decodedToken = authenticationService.getDecodedToken();

  if (!decodedToken || !decodedToken['platformId']) {
    router.navigate(['/404']);
    return false;
  }
  return true;
};
