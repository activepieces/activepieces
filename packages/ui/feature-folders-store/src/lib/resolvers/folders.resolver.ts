import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, forkJoin, map, tap, of } from 'rxjs';
import { FlowId, FolderDto, PopulatedFlow } from '@activepieces/shared';
import { FoldersService } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { FlowService } from '@activepieces/ui/common';
import { FolderActions } from '../store/folders.actions';
export const ARE_THERE_FLOWS_FLAG = 'areThererFlows';

type FoldersResolverResult = {
  folders: FolderDto[];
  allFlowsNumber: number;
  uncategorizedFlowsNumber: number;
};
@Injectable({
  providedIn: 'root',
})
export class FoldersResolver {
  constructor(
    private foldersService: FoldersService,
    private store: Store,
    private flowsService: FlowService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<FoldersResolverResult> {
    const countAllFlows$ = this.flowsService.count({});
    const countUncategorizedFlows$ = this.flowsService.count({
      folderId: 'NULL',
    });
    let flow$: Observable<null | PopulatedFlow> = of(null);
    const flowId = route.paramMap.get('id') as FlowId;
    if (flowId) {
      flow$ = this.flowsService.get(flowId);
    }
    const folders$ = this.foldersService.list().pipe(map((res) => res.data));
    const selectedFolderId = route.queryParams['folderId'];
    return forkJoin({
      allFlowsNumber: countAllFlows$,
      uncategorizedFlowsNumber: countUncategorizedFlows$,
      folders: folders$,
      flow: flow$,
    }).pipe(
      tap((res) => {
        this.store.dispatch(
          FolderActions.setInitial({
            ...res,
            //because resolver gets used for both builder and flows table, so you gotta choose between
            selectedFolderId: res.flow ? res.flow.folderId : selectedFolderId,
          })
        );
      })
    );
  }
}
