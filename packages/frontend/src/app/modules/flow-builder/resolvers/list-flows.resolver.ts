import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { SeekPage } from '../../common/model/seek-page';
import { Flow } from '../../common/model/flow.class';
import { FlowService } from '../../common/service/flow.service';
import { UUID } from 'angular2-uuid';

@Injectable({
	providedIn: 'root',
})
export class ListFlowsResolver implements Resolve<Observable<SeekPage<Flow>>> {
	constructor(private flowService: FlowService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<SeekPage<Flow>> {
		const pieceId = snapshot.paramMap.get('id') as UUID;
		return this.flowService.listByCollection(pieceId, 9999);
	}
}
