import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { first, Observable, switchMap } from 'rxjs';
import { SeekPage } from '../../common-layout/service/seek-page';
import { EnvironmentService } from '../../common-layout/service/environment.service';
import { Account } from '../../common-layout/model/account.interface';
import { AccountService } from '../../common-layout/service/account.service';

@Injectable({
	providedIn: 'root',
})
export class ListAccountsResolver implements Resolve<Observable<SeekPage<Account>>> {
	constructor(private accountService: AccountService, private environmentService: EnvironmentService) {}

	resolve(route: ActivatedRouteSnapshot): Observable<SeekPage<Account>> {
		return this.environmentService
			.selectedEnvironment(route.queryParamMap.get('environment'))
			.pipe(first())
			.pipe(
				switchMap(environment => {
					if (environment == undefined) {
						return new Observable<SeekPage<Account>>();
					}
					return this.accountService.list(environment.id, 9999);
				})
			);
	}
}
