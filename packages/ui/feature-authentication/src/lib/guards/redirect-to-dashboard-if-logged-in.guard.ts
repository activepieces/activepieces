import { Injectable } from '@angular/core';
import {
  AuthenticationService,
  NavigationService,
  findHomePageRouteForRole,
} from '@activepieces/ui/common';
@Injectable({
  providedIn: 'root',
})
export class RedirectToDashboardIfLoggedInGuard {
  constructor(
    private auth: AuthenticationService,
    private navigationService: NavigationService
  ) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      return true;
    }
    if (this.auth.currentUser.projectRole) {
      const route = [
        findHomePageRouteForRole(this.auth.currentUser.projectRole),
      ];
      this.navigationService.navigate({
        route,
      });
    } else {
      this.navigationService.navigate({
        route: ['/flows'],
      });
    }
    return false;
  }
}
