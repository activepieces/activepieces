import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedIn {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean {
    const currentURL: string = window.location.href;
    const baseURL: string = window.location.origin; // Gets the base URL (protocol + domain + port)
    const relativeURL: string = currentURL.replace(baseURL, '');
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/sign-in'], {
        queryParams: { redirect_url: relativeURL },
      });
      return false;
    }
    return true;
  }
}
