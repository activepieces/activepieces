import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthenticationService } from '../layout/common-layout/service/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class IsNotFirstSignIn implements CanActivate {
	constructor(private auth: AuthenticationService, private router: Router) {}

	canActivate() {
		return this.auth.isFirstSignIn().pipe(
			map(res => {
				if (res) {
					this.router.navigate(['/sign-up']);
				}
				return !res;
			})
		);
	}
}
