import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@activepieces/ui/common';
@Injectable({
  providedIn: 'root',
})
export class RedirectToDashboardIfLoggedIn {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/flows']);
      return false;
    }
    return true;
  }
}
