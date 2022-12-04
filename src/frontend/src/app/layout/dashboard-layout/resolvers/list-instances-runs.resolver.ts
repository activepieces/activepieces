import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { catchError, first, Observable, of, switchMap } from 'rxjs';
import { SeekPage } from '../../common-layout/service/seek-page';
import { EnvironmentService } from '../../common-layout/service/environment.service';
import { AccountService } from '../../common-layout/service/account.service';
import { InstanceRun } from '../../common-layout/model/instance-run.interface';
import { InstanceRunService } from '../../common-layout/service/instance-run.service';
import { UUID } from 'angular2-uuid';

@Injectable({
	providedIn: 'root',
})
export class ListInstancesRunResolver implements Resolve<Observable<SeekPage<InstanceRun>>> {
	flowNameCached: Map<UUID, Observable<string>> = new Map<UUID, Observable<string>>();
	accountNameCached: Map<UUID, Observable<string>> = new Map<UUID, Observable<string>>();
	pieceNameCached: Map<UUID, Observable<string>> = new Map<UUID, Observable<string>>();

	constructor(
		private accountService: AccountService,
		private instanceRunService: InstanceRunService,
		private environmentService: EnvironmentService
	) {}

	resolve(route: ActivatedRouteSnapshot): Observable<SeekPage<InstanceRun>> {
		return this.environmentService
			.selectedEnvironment(route.queryParamMap.get('environment'))
			.pipe(first())
			.pipe(
				switchMap(environment => {
					if (environment == undefined) {
						return new Observable<SeekPage<InstanceRun>>();
					}
					const queryParams: any = {};
					queryParams.limit = 10;
					if (route.queryParamMap.has('startingAfter')) {
						queryParams.startingAfter = route.queryParamMap.get('startingAfter');
					}
					if (route.queryParamMap.has('instanceId')) {
						queryParams['instanceId'] = route.queryParamMap.get('instanceId');
					}
					if (route.queryParamMap.has('accountName')) {
						const accountName = route.queryParamMap.get('accountName');
						if (accountName === null) {
							return of(this.instanceRunService.emptyPage());
						}
						return this.accountService.getByNameAndEnvironment(environment.id, accountName).pipe(
							switchMap(value => {
								queryParams['accountId'] = value.id;
								return this.loadInstanceRun(environment.id, queryParams);
							}),
							catchError(e => {
								console.log(e);
								return of(this.instanceRunService.emptyPage());
							})
						);
					}
					return this.loadInstanceRun(environment.id, queryParams);
				})
			);
	}

	loadInstanceRun(environmentId: UUID, queryParams): Observable<SeekPage<InstanceRun>> {
		return this.instanceRunService.list(environmentId, queryParams);
	}
}
