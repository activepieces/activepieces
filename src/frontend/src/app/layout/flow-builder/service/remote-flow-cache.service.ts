import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';

import { FlowVersion } from '../../common-layout/model/flow-version.class';
import { FlowService } from '../../common-layout/service/flow.service';

@Injectable({
	providedIn: 'root',
})
export class RemoteFlowCacheService {
	private cache: Map<UUID, Observable<FlowVersion[]>> = new Map();
	constructor(private flowService: FlowService) {}

	getCollectionFlowsVersions(collectionId: UUID, flowsVersionsIds: UUID[]) {
		const cacheResult = this.cache.get(collectionId);
		if (cacheResult) {
			return cacheResult;
		} else {
			const flows$: { [key: string]: Observable<FlowVersion> } = {};
			flowsVersionsIds.forEach(flowVerId => {
				flows$[flowVerId.toString()] = this.flowService.getVersion(flowVerId);
			});
			const joinedRequests = forkJoin(flows$).pipe(
				map(res => {
					const flowVersions = Object.keys(res).map(flowVerId => {
						return res[flowVerId];
					});
					return flowVersions;
				}),
				shareReplay(1)
			);
			this.cache.set(collectionId, joinedRequests);
			return joinedRequests;
		}
	}
}
