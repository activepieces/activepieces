import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map, of, switchMap,forkJoin } from 'rxjs';

import { PopulatedFlow, FlowId, Folder, FlowVersion } from '@activepieces/shared';
import { FlowService, FoldersService } from '@activepieces/ui/common';

export type FlowResolverData = { flow: PopulatedFlow; folder?: Folder , publishedFlowVersion?: FlowVersion };
@Injectable({
  providedIn: 'root',
})
export class GetFlowResolver {
  constructor(
    private flowService: FlowService,
    private folderService: FoldersService
  ) {}

  resolve(snapshot: ActivatedRouteSnapshot): Observable<FlowResolverData> {
    const flowId = snapshot.paramMap.get('id') as FlowId;
    return this.flowService.get(flowId, undefined).pipe(
      switchMap((flow) => {

        const observables$:{publishedFlowVersion:Observable<FlowVersion|undefined>,folder:Observable<Folder|undefined>,flow:Observable<PopulatedFlow>} = { publishedFlowVersion:of(undefined), folder:of(undefined),flow:of(flow)}
 
        if (flow.folderId) {
          observables$.folder= this.folderService.get(flow.folderId);
        }
        if(flow.publishedVersionId)
        {
          observables$.publishedFlowVersion = this.flowService.get(flow.id, flow.publishedVersionId).pipe(map(flow=>flow.version));
        }

        return forkJoin(observables$);
      })
    );
  }
}
