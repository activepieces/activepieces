import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  catchError,
  distinctUntilChanged,
  BehaviorSubject,
} from 'rxjs';
import {
  ApPaginatorComponent,
  DEFAULT_PAGE_SIZE,
  FlowService,
} from '@activepieces/ui/common';

import { FormControl } from '@angular/forms';
import { Flow, FlowInstanceStatus, FoldersListDto } from '@activepieces/shared';
import { FlowTableDto } from '@activepieces/shared';
import { Params } from '@angular/router';


type FlowListDtoWithInstanceStatusToggleControl = Flow & {
  instanceToggleControl: FormControl<boolean>;
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
    private paginator: ApPaginatorComponent,
    private flowService: FlowService,
    private refresh$: Observable<boolean>,
    private displayAllFlows$: Observable<boolean>,
    private currentFolder$: Observable<FoldersListDto | undefined>
  ) {
    super();
    this.refresh$;
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<FlowListDtoWithInstanceStatusToggleControl[]> {
    const allFlowsAndCurrentFolder$ = combineLatest({
      displayAllFlows: this.displayAllFlows$,
      currentFolder: this.currentFolder$,
    }).pipe(
      distinctUntilChanged((current, next) => {
        return JSON.stringify(current) === JSON.stringify(next);
      })
    );
    return combineLatest({
      queryParams: this.queryParams$,
      allFlowsAndCurrentFolder: allFlowsAndCurrentFolder$,
    }).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap((res) => {
        return this.flowService.list({
          limit: res.queryParams['limit'] || DEFAULT_PAGE_SIZE,
          cursor: res.queryParams['cursor'],
          folderId: res.allFlowsAndCurrentFolder.displayAllFlows
            ? undefined
            : res.allFlowsAndCurrentFolder.currentFolder?.id || 'NULL',
        });
      }),
      catchError((err) => {
        throw err;
      }),
      tap((res) => {
        this.paginator.next = res.next;
        this.paginator.previous = res.previous;
        this.isLoading$.next(false);
        const instanceTogglesControls = this.createTogglesControls(res.data);
        this.data = res.data.map((c) => {
          return {
            ...c,
            instanceToggleControl: instanceTogglesControls[c.id],
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
  createTogglesControls(flows: FlowTableDto[]) {
    const controls: Record<string, FormControl> = {};
    flows.forEach((f) => {
      controls[f.id] = new FormControl({
        value: f.status === FlowInstanceStatus.ENABLED,
        disabled: f.status === FlowInstanceStatus.UNPUBLISHED,
      });
    });
    return controls;
  }
}
