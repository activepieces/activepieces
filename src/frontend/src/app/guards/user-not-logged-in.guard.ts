import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../layout/common-layout/service/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class UserNotLoggedIn implements CanActivate {
	constructor(private auth: AuthenticationService, private router: Router) {}

	canActivate(): boolean {
		if (this.auth.isLoggedIn()) {
			this.router.navigate(['/']);
			return false;
		}

		return true;
	}
}
