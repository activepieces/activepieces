import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { Collection } from '../../common/model/collection.interface';
import { CollectionService } from '../../common/service/collection.service';
import { FlowService } from '../../common/service/flow.service';
import { InstanceRunService } from '../../common/service/instance-run.service';
import { InstanceRun } from '../../common/model/instance-run.interface';
import { Flow } from '../../common/model/flow.class';

export type InstanceRunInfo = {
	collection: Collection;
	flow: Flow;
	run: InstanceRun;
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
				return this.flowService.getVersion(run.flow_version_id).pipe(
					switchMap(flowVersion => {
						return this.flowService.get(flowVersion.flow_id).pipe(
							switchMap(flow => {
								return this.collectionService.get(flow.collectionId).pipe(
									switchMap(collection => {
										return of({ collection: collection, flow: { ...flow, last_version: flowVersion }, run: run });
									})
								);
							})
						);
					})
				);
			})
		);
	}
}
