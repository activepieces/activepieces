import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthenticationService } from '../layout/common-layout/service/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class FirstSignIn implements CanActivate {
	constructor(private auth: AuthenticationService, private router: Router) {}

	canActivate() {
		return this.auth.isFirstSignIn().pipe(
			tap(res => {
				if (!res) {
					this.router.navigate(['/']);
				}
			})
		);
	}
}
