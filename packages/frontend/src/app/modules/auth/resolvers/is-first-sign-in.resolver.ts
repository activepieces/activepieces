import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthenticationService } from '../../common/service/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class IsFirstSignInResolver implements Resolve<boolean> {
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		return this.auth.isFirstSignIn().pipe(
			tap(isFirstSignIn => {
				if (isFirstSignIn) {
					this.router.navigate(['/sign-up']);
				}
			})
		);
	}
	constructor(private auth: AuthenticationService, private router: Router) {}
}
