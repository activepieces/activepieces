import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../service';
import { ProjectMemberRole } from '@activepieces/shared';

export const showBasedOnRoles: (roles: ProjectMemberRole[]) => CanActivateFn = (
  roles: ProjectMemberRole[]
) => {
  return (): boolean => {
    const authenticationService = inject(AuthenticationService);
    const router = inject(Router);
    if (
      authenticationService.currentUser.projectRole === null ||
      authenticationService.currentUser.projectRole === undefined
    ) {
      return true;
    }
    const result =
      roles.findIndex(
        (role) => role === authenticationService.currentUser.projectRole
      ) > -1;

    if (!result) {
      router.navigate(['/404']);
    }
    return result;
  };
};
