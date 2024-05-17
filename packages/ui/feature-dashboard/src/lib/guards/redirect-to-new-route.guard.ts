import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { NavigationService } from '@activepieces/ui/common';

export const redirectToNewRouteGuard: (newRoute: string) => CanActivateFn = (
  newRoute
) => {
  return (route: ActivatedRouteSnapshot) => {
    const navigationService = inject(NavigationService);
    const queryParams = route.queryParams;
    navigationService.navigate({
      route: [newRoute],
      extras: { queryParams },
    });
    return false;
  };
};
