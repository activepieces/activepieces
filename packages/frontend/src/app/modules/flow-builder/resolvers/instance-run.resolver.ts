import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { CollectionService } from '../../common/service/collection.service';
import { FlowService } from '../../common/service/flow.service';
import { InstanceRunService } from '../../common/service/flow-run.service';
import { Collection, Flow, FlowRun } from 'shared';

export type InstanceRunInfo = {
	collection: Collection;
	flow: Flow;
	run: FlowRun;
};

@Injectable({
	providedIn: 'root',
})
export class GetInstanceRunResolver implements Resolve<Observable<InstanceRunInfo>> {
	constructor(
		private instanceRunService: InstanceRunService,
		private flowService: FlowService,
		private collectionService: CollectionService
	) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<InstanceRunInfo> {
		const runId = snapshot.paramMap.get('runId') as string;
		return this.instanceRunService.get(runId).pipe(
			switchMap(run => {
				return this.flowService.get(run.flowId, run.flowVersionId).pipe(
					switchMap(flow => {
						return this.collectionService.get(flow.collectionId).pipe(
							switchMap(collection => {
								return of({ collection: collection, flow: flow, run: run });
							})
						);
					})
				);
			})
		);
	}
}
