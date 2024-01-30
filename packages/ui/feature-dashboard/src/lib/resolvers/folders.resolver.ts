import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { FolderDto } from '@activepieces/shared';
import { FoldersService } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';

import { FolderActions } from '@activepieces/ui/feature-folders-store';
import { FlowService } from '@activepieces/ui/common';
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
    const folders$ = this.foldersService.list().pipe(map((res) => res.data));
    const selectedFolderId = route.queryParams['folderId'];
    return forkJoin({
      allFlowsNumber: countAllFlows$,
      uncategorizedFlowsNumber: countUncategorizedFlows$,
      folders: folders$,
    }).pipe(
      tap((res) => {
        this.store.dispatch(
          FolderActions.setInitial({
            ...res,
            selectedFolderId: selectedFolderId,
          })
        );
      })
    );
  }
}
