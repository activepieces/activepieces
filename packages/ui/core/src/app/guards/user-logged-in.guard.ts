import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedIn {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/sign-in'], {
        queryParams: { redirect_url: window.location.href },
      });
      return false;
    }
    return true;
  }
}
