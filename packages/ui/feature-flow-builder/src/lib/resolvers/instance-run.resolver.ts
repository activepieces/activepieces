import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';

import { FlowService, FoldersService } from '@activepieces/ui/common';
import { InstanceRunService } from '@activepieces/ui/common';
import { PopulatedFlow, FlowRun, Folder } from '@activepieces/shared';

export type InstanceRunResolverData = {
  flow: PopulatedFlow;
  run: FlowRun;
  folder?: Folder;
};

@Injectable({
  providedIn: 'root',
})
export class GetInstanceRunResolver {
  constructor(
    private instanceRunService: InstanceRunService,
    private flowService: FlowService,
    private folderService: FoldersService
  ) {}

  resolve(
    snapshot: ActivatedRouteSnapshot
  ): Observable<InstanceRunResolverData> {
    const runId = snapshot.paramMap.get('runId') as string;
    return this.instanceRunService.get(runId).pipe(
      switchMap((run) => {
        return this.flowService.get(run.flowId, run.flowVersionId).pipe(
          switchMap((flow) => {
            if (!flow.folderId) {
              return of({ flow: flow, run: run });
            }
            return this.folderService.get(flow.folderId).pipe(
              map((folder) => {
                return { flow, run, folder };
              })
            );
          })
        );
      })
    );
  }
}
