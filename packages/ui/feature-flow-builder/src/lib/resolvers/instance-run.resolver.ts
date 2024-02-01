import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap,tap } from 'rxjs';

import { AppConnectionsService, AuthenticationService, FlowService, FoldersService, connections$ } from '@activepieces/ui/common';
import { InstanceRunService } from '@activepieces/ui/common';
import { PopulatedFlow, FlowRun, Folder } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { BuilderActions, TestRunBarComponent, ViewModeEnum } from '@activepieces/ui/feature-builder-store';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private folderService: FoldersService,
    private store:Store,
    private snackbar:MatSnackBar,
    private authenticationService:AuthenticationService,
    private appConnectionsService:AppConnectionsService
  ) {}

  resolve(
    snapshot: ActivatedRouteSnapshot
  ): Observable<string> {
    const runId = snapshot.paramMap.get('runId') as string;
    const connections = connections$(this.store,this.appConnectionsService,this.authenticationService);
    const data$ = forkJoin({
      run:this.instanceRunService.get(runId),
      connections
    })
    return  data$.pipe(
      switchMap(({run, connections}) => {
        return this.flowService.get(run.flowId, run.flowVersionId).pipe(
          switchMap((flow) => {
            if (!flow.folderId) {
              return of({ flow: flow, run: run, connections });
            }
            return this.folderService.get(flow.folderId).pipe(
              map((folder) => {
                return { flow, run, folder, connections };
              })
            );
          }),
          tap((res)=>{
            this.store.dispatch(
              BuilderActions.loadInitial({
                flow: res.flow,
                viewMode: ViewModeEnum.VIEW_INSTANCE_RUN,
                run:res.run,
                appConnections: res.connections
              })
            );
            this.snackbar.openFromComponent(TestRunBarComponent, {
              duration: undefined,
            });
          }),
          map((res)=>{
            return res.flow.version.displayName;
          })
        );
      })
    );
  }
}
