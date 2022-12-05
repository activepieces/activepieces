import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { Collection } from '../../common-layout/model/piece.interface';
import { CollectionService } from '../../common-layout/service/collection.service';
import { FlowService } from '../../common-layout/service/flow.service';
import { UUID } from 'angular2-uuid';
import { InstanceRunService } from '../../common-layout/service/instance-run.service';
import { InstanceRun } from '../../common-layout/model/instance-run.interface';
import { Flow } from '../../common-layout/model/flow.class';

@Injectable({
	providedIn: 'root',
})
export class GetInstanceRunResolver
	implements Resolve<Observable<{ piece: Collection; flow: Flow; run: InstanceRun }>>
{
	constructor(
		private instanceRunService: InstanceRunService,
		private flowService: FlowService,
		private pieceService: CollectionService
	) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<{ piece: Collection; flow: Flow; run: InstanceRun }> {
		const runId = snapshot.paramMap.get('runId') as UUID;
		return this.instanceRunService.get(runId).pipe(
			switchMap(run => {
				return this.flowService.getVersion(run.flowVersionId).pipe(
					switchMap(flowVersion => {
						return this.flowService.get(flowVersion.flow_id).pipe(
							switchMap(flow => {
								return this.pieceService.get(flow.collection_id).pipe(
									switchMap(piece => {
										return of({ piece: piece, flow: flow, run: run });
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
