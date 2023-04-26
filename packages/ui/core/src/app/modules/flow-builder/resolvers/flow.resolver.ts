import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';

import { Flow, FlowId, Folder } from '@activepieces/shared';
import { FlowService, FoldersService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class GetFlowResolver
  implements Resolve<Observable<{ flow: Flow; folder?: Folder }>>
{
  constructor(
    private flowService: FlowService,
    private folderService: FoldersService
  ) {}

  resolve(
    snapshot: ActivatedRouteSnapshot
  ): Observable<{ flow: Flow; folder?: Folder }> {
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
