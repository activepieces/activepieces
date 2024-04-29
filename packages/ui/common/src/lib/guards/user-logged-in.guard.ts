import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, RedirectService } from '../service';
import { Observable, map } from 'rxjs';
import { isNil } from '@activepieces/shared';
import { ProjectService } from '../service/project.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedInGuard {
  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private redirectService: RedirectService,
    private projectService: ProjectService,
    private snackbar: MatSnackBar,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(): boolean | Observable<boolean> {
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
    if (this.auth.isLoggedIn() && isNil(this.auth.getPlatformId())) {
      this.authenticationService.logout();
      return false;
    }
    // TODO FIX
    return this.projectService.currentProject$.pipe(
      map((project) => {
        if (isNil(project)) {
          this.snackbar.open($localize`Your session expired`);
          this.auth.logout();
          this.router.navigate(['/sign-in']);
          return false;
        }
        return true;
      })
    );
  }
}
