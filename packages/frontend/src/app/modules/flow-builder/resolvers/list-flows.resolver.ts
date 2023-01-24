import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { FlowService } from '../../common/service/flow.service';
import { Flow, FlowId, SeekPage } from '@activepieces/shared';

@Injectable({
	providedIn: 'root',
})
export class ListFlowsResolver implements Resolve<Observable<SeekPage<Flow>>> {
	constructor(private flowService: FlowService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<SeekPage<Flow>> {
		const pieceId = snapshot.paramMap.get('id') as FlowId;
		return this.flowService.listByCollection(pieceId);
	}
}
