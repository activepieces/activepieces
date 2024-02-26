import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthenticationService,
  findHomePageRouteForRole,
} from '@activepieces/ui/common';
@Injectable({
  providedIn: 'root',
})
export class RedirectToDashboardIfLoggedIn {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      return true;
    }
    if (this.auth.currentUser.projectRole) {
      const route = findHomePageRouteForRole(this.auth.currentUser.projectRole);
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/flows']);
    }
    return false;
  }
}
