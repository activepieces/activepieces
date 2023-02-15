import { Injectable } from '@angular/core';
import { Router, Resolve } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { FlagService } from '../../common/service/flag.service';

@Injectable({
	providedIn: 'root',
})
export class IsFirstSignInResolver implements Resolve<boolean> {
	resolve(): Observable<boolean> {
		return this.flagService.isFirstSignIn().pipe(
			tap(isFirstSignIn => {
				if (isFirstSignIn) {
					this.router.navigate(['/sign-up']);
				}
			})
		);
	}
	constructor(private flagService: FlagService, private router: Router) { }
}
