import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  catchError,
  BehaviorSubject,
  forkJoin,
} from 'rxjs';
import {
  ApPaginatorComponent,
  AuthenticationService,
  CURSOR_QUERY_PARAM,
  DEFAULT_PAGE_SIZE,
  FOLDER_QUERY_PARAM,
  FlowService,
  LIMIT_QUERY_PARAM,
} from '@activepieces/ui/common';

import { FormControl } from '@angular/forms';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';
import { Params } from '@angular/router';
import { FoldersService } from '@activepieces/ui/common';
import { FolderActions } from '../../store/folders/folders.actions';
import { Store } from '@ngrx/store';

type FlowListDtoWithInstanceStatusToggleControl = PopulatedFlow & {
  instanceToggleControl: FormControl<boolean>;
  folderDisplayName: string;
};

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class FlowsTableDataSource extends DataSource<FlowListDtoWithInstanceStatusToggleControl> {
  data: FlowListDtoWithInstanceStatusToggleControl[] = [];
  public isLoading$ = new BehaviorSubject(false);
  constructor(
    private queryParams$: Observable<Params>,
    private folderService: FoldersService,
    private paginator: ApPaginatorComponent,
    private authenticationService: AuthenticationService,
    private flowService: FlowService,
    private refresh$: Observable<boolean>,
    private store: Store
  ) {
    super();
  }

  /**
   * Connects this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<FlowListDtoWithInstanceStatusToggleControl[]> {
    return combineLatest({
      queryParams: this.queryParams$,
      refresh: this.refresh$,
    }).pipe(
      tap((res) => {
        if (res.queryParams['folderId']) {
          this.store.dispatch(
            FolderActions.selectFolder({
              folderId: res.queryParams['folderId'],
            })
          );
        } else {
          this.store.dispatch(FolderActions.showAllFlows());
        }
        this.isLoading$.next(true);
      }),
      switchMap((res) => {
        const { queryParams } = res;
        return forkJoin([
          this.flowService.list({
            projectId: this.authenticationService.getProjectId(),
            limit: queryParams[LIMIT_QUERY_PARAM] || DEFAULT_PAGE_SIZE,
            cursor: queryParams[CURSOR_QUERY_PARAM],
            folderId: queryParams[FOLDER_QUERY_PARAM] || undefined,
          }),
          this.folderService.list(),
        ]);
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      }),
      tap(([flowPage, folders]) => {
        this.paginator.next = flowPage.next;
        this.paginator.previous = flowPage.previous;
        this.isLoading$.next(false);
        const instanceTogglesControls = this.createTogglesControls(
          flowPage.data
        );
        this.data = flowPage.data.map((flow) => {
          return {
            ...flow,
            folderDisplayName:
              folders.data.find((folder) => folder.id === flow.folderId)
                ?.displayName ?? $localize`Uncategorized`,
            instanceToggleControl: instanceTogglesControls[flow.id],
          };
        });
      }),
      map(() => this.data)
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
  createTogglesControls(flows: PopulatedFlow[]) {
    const controls: Record<string, FormControl> = {};
    flows.forEach((f) => {
      controls[f.id] = new FormControl({
        value: f.status === FlowStatus.ENABLED,
        disabled: f.publishedVersionId === null,
      });
    });
    return controls;
  }
}
