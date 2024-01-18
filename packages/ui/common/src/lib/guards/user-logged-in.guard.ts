import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, RedirectService } from '../service';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedIn {
  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private redirectService: RedirectService
  ) {}

  canActivate(): boolean {
    const currentURL = window.location.href;
    const relativeURL = currentURL.replace(window.location.origin, '');

    // Set the default redirect URL
    let redirectTo = '/sign-in';

    // Check if the URL starts with "/invitation"
    if (relativeURL.startsWith('/invitation')) {
      redirectTo = '/sign-up';
    }

    // Redirect to the appropriate page if the user is not logged in
    if (!this.auth.isLoggedIn()) {
      this.redirectService.setRedirectRouteToCurrentRoute();
      this.router.navigate([redirectTo]);
      return false;
    }

    return true;
  }
}
