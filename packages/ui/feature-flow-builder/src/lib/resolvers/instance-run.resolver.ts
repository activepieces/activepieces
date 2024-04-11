import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { FlowService, FoldersService } from '@activepieces/ui/common';
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
    private store: Store,
    private snackbar: MatSnackBar
  ) { }

  resolve(
    snapshot: ActivatedRouteSnapshot
  ): Observable<string> {
    const runId = snapshot.paramMap.get('runId') as string;
    const data$ = forkJoin({
      run: this.instanceRunService.get(runId),
    })
    return data$.pipe(
      switchMap(({ run }) => {
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
          }),
          tap((res) => {
            this.store.dispatch(
              BuilderActions.loadInitial({
                flow: res.flow,
                viewMode: ViewModeEnum.VIEW_INSTANCE_RUN,
                run: res.run,
              })
            );
            this.snackbar.openFromComponent(TestRunBarComponent, {
              duration: undefined,
            });
          }),
          map((res) => {
            return res.flow.version.displayName;
          })
        );
      })
    );
  }
}
