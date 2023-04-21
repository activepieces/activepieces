import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedIn implements CanActivate {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/sign-in']);
      return false;
    }
    return true;
  }
}
