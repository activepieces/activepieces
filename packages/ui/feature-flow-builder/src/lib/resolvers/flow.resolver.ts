import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map, of, switchMap, forkJoin, tap } from 'rxjs';
import {
  PopulatedFlow,
  FlowId,
  Folder,
  FlowVersion,
} from '@activepieces/shared';
import { FlowService, FoldersService} from '@activepieces/ui/common';
import {
  BuilderActions,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';


@Injectable({
  providedIn: 'root',
})
export class GetFlowResolver {
  constructor(
    private flowService: FlowService,
    private folderService: FoldersService,
    private store: Store,
  ) {}

  resolve(snapshot: ActivatedRouteSnapshot): Observable<string> {
    const flowId = snapshot.paramMap.get('id') as FlowId;
    return this.flowService.get(flowId, undefined).pipe(
      switchMap((flow) => {
      
        const observables$: {
          publishedFlowVersion: Observable<FlowVersion | undefined>;
          folder: Observable<Folder | undefined>;
          flow: Observable<PopulatedFlow>;
        } = {
          publishedFlowVersion: of(undefined),
          folder: of(undefined),
          flow: of(flow),
        };
        if (flow.folderId) {
          observables$.folder = this.folderService.get(flow.folderId);
        }
        if (flow.publishedVersionId) {
          observables$.publishedFlowVersion = this.flowService
            .get(flow.id, flow.publishedVersionId)
            .pipe(map((flow) => flow.version));
        }
        return forkJoin(observables$).pipe(
          tap((res) => {
            this.store.dispatch(
              BuilderActions.loadInitial({
                flow: res.flow,
                viewMode: ViewModeEnum.BUILDING,
                publishedVersion: res.publishedFlowVersion,
              })
            );
          }),
          map((res)=>{
           return res.flow.version.displayName;
          })
        );
      })
    );
  }
}
