import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { catchError, first, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CollectionService } from '../../common-layout/service/collection.service';
import { SeekPage } from '../../common-layout/service/seek-page';
import { FlowService } from '../../common-layout/service/flow.service';
import { EnvironmentService } from '../../common-layout/service/environment.service';
import { AccountService } from '../../common-layout/service/account.service';
import { Instance } from '../../common-layout/model/instance.interface';
import { InstanceService } from '../../common-layout/service/instance.service';
import { UUID } from 'angular2-uuid';
import { InstanceRunService } from '../../common-layout/service/instance-run.service';

@Injectable({
	providedIn: 'root',
})
export class ListInstancesResolver implements Resolve<Observable<SeekPage<Instance>>> {
	cache: Map<UUID, Observable<any>> = new Map<UUID, Observable<any>>();

	constructor(
		private instanceService: InstanceService,
		private accountService: AccountService,
		private pieceService: CollectionService,
		private flowService: FlowService,
		private instanceRunsService: InstanceRunService,
		private environmentService: EnvironmentService
	) {}

	resolve(route: ActivatedRouteSnapshot): Observable<SeekPage<Instance>> {
		return this.environmentService
			.selectedEnvironment(route.queryParamMap.get('environment'))
			.pipe(first())
			.pipe(
				switchMap(environment => {
					if (environment == undefined) {
						return new Observable<SeekPage<Instance>>();
					}
					const queryParams = { limit: 9999 };
					if (route.queryParamMap.has('accountName')) {
						const accountName = route.queryParamMap.get('accountName');
						if (accountName === null) {
							return of(this.accountService.emptyPage());
						}
						return this.accountService.getByNameAndEnvironment(environment.id, accountName).pipe(
							switchMap(value => {
								queryParams['accountId'] = value.id;
								return this.loadInstanceRun(environment.id, queryParams);
							}),
							catchError(e => {
								return of(this.accountService.emptyPage());
							})
						);
					}
					return this.loadInstanceRun(environment.id, queryParams);
				})
			);
	}

	loadInstanceRun(environmentId: UUID, queryParams): Observable<SeekPage<Instance>> {
		return this.instanceService.list(environmentId, queryParams).pipe(
			switchMap(page => {
				if (page.data.length === 0) {
					return of(page);
				}
				return forkJoin(page.data.map(item => this.enrichItem(item))).pipe(
					map(items => {
						page.data = items;
						return page;
					})
				);
			})
		);
	}

	enrichItem(item: Instance): Observable<Instance> {
		return forkJoin(
			this.cachedAccountName(item.accountId).pipe(),
			this.cachedPieceName(item.collectionVersionId).pipe(),
			this.cachedRunsCount(item.id).pipe()
		).pipe(
			map(results => {
				item.accountDisplayName = results[0];
				item.pieceDisplayName = results[1];
				item.runs = results[2];
				return item;
			})
		);
	}

	cachedFlowName(flowVersionId: UUID): Observable<string> {
		let cacheName = this.cache.get(flowVersionId);
		if (cacheName === undefined) {
			cacheName = this.flowService.getVersion(flowVersionId).pipe(map(f => f.displayName));
			this.cache.set(flowVersionId, cacheName);
		}
		return cacheName;
	}

	cachedAccountName(accountId: UUID): Observable<string> {
		let cacheName = this.cache.get(accountId);
		if (cacheName === undefined) {
			cacheName = this.accountService.get(accountId).pipe(map(f => f.name));
			this.cache.set(accountId, cacheName);
		}
		return cacheName;
	}

	cachedPieceName(pieceVersionId: UUID) {
		let cacheName = this.cache.get(pieceVersionId);
		if (cacheName === undefined) {
			cacheName = this.pieceService.getVersion(pieceVersionId).pipe(map(f => f.displayName));
			this.cache.set(pieceVersionId, cacheName);
		}
		return cacheName;
	}

	cachedRunsCount(instanceId: UUID) {
		let cacheName = this.cache.get(instanceId);
		if (cacheName === undefined) {
			cacheName = this.instanceRunsService.count(instanceId).pipe(map(f => f));
			this.cache.set(instanceId, cacheName);
		}
		return cacheName;
	}
}
