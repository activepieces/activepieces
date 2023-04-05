import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Flow, FlowId, SeekPage } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';

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
