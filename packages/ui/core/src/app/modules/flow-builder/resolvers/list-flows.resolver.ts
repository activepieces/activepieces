import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Flow, FlowId } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class GetFlowResolver implements Resolve<Observable<Flow>> {
  constructor(private flowService: FlowService) {}

  resolve(snapshot: ActivatedRouteSnapshot): Observable<Flow> {
    const flowId = snapshot.paramMap.get('id') as FlowId;
    return this.flowService.get(flowId, undefined);
  }
}
