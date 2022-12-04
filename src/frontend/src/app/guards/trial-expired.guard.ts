import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../layout/common-layout/service/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class TrialExpiredGuard implements CanActivate {
	constructor(private authenticationService: AuthenticationService, private router: Router) {}
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		const now = new Date().getTime() / 1000;
		if (
			this.authenticationService.currentUser.epochExpirationTime &&
			this.authenticationService.currentUser.epochExpirationTime < now
		) {
			this.router.navigate(['/trial-status']);
			return false;
		}

		return true;
	}
}
