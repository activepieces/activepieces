import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';

import { Flow, FlowId, Folder } from '@activepieces/shared';
import { FlowService, FoldersService } from '@activepieces/ui/common';

export type FlowResolverData = { flow: Flow; folder?: Folder };
@Injectable({
  providedIn: 'root',
})
export class GetFlowResolver implements Resolve<Observable<FlowResolverData>> {
  constructor(
    private flowService: FlowService,
    private folderService: FoldersService
  ) {}

  resolve(snapshot: ActivatedRouteSnapshot): Observable<FlowResolverData> {
    const flowId = snapshot.paramMap.get('id') as FlowId;
    return this.flowService.get(flowId, undefined).pipe(
      switchMap((flow) => {
        if (flow.folderId) {
          return this.folderService.get(flow.folderId).pipe(
            map((folder) => {
              return {
                folder,
                flow,
              };
            })
          );
        }
        return of({ flow });
      })
    );
  }
}
