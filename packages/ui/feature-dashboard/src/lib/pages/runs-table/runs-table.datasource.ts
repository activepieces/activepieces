import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  catchError,
  of,
  take,
  BehaviorSubject,
} from 'rxjs';
import { FlowRunStatus, FlowRun } from '@activepieces/shared';
import {
  InstanceRunService,
  ApPaginatorComponent,
  ProjectSelectors,
  DEFAULT_PAGE_SIZE,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
  STATUS_QUERY_PARAM,
  FLOW_QUERY_PARAM,
  DATE_RANGE_START_QUERY_PARAM,
  DATE_RANGE_END_QUERY_PARAM,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { Params } from '@angular/router';
const REFRESH_TABLE_DELAY = 10000;
/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class RunsTableDataSource extends DataSource<FlowRun> {
  data: FlowRun[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  refreshForExecutingRuns$: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  refreshTimer: NodeJS.Timeout | undefined;
  constructor(
    private queryParams$: Observable<Params>,
    private paginator: ApPaginatorComponent,
    private store: Store,
    private instanceRunService: InstanceRunService,
    private refreshForReruns$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<FlowRun[]> {
    return combineLatest({
      queryParams: this.queryParams$,
      project: this.store
        .select(ProjectSelectors.selectCurrentProject)
        .pipe(take(1)),
      refresh: this.refreshForExecutingRuns$.asObservable(),
      refreshForReruns: this.refreshForReruns$,
    }).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap((res) => {
        return this.instanceRunService.list(res.project.id, {
          status: res.queryParams[STATUS_QUERY_PARAM],
          limit: res.queryParams[LIMIT_QUERY_PARAM] || DEFAULT_PAGE_SIZE,
          cursor: res.queryParams[CURSOR_QUERY_PARAM],
          flowId: res.queryParams[FLOW_QUERY_PARAM],
          createdAfter: res.queryParams[DATE_RANGE_START_QUERY_PARAM],
          createdBefore: res.queryParams[DATE_RANGE_END_QUERY_PARAM],
        });
      }),
      catchError((err) => {
        console.error(err);
        return of({
          next: '',
          previous: '',
          data: [],
        });
      }),
      tap((res) => {
        this.isLoading$.next(false);
        this.paginator.setNextAndPrevious(res.next, res.previous);
        this.data = res.data;
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
        }
        if (res.data.find((run) => run.status === FlowRunStatus.RUNNING)) {
          this.refreshTimer = setTimeout(() => {
            this.refreshForExecutingRuns$.next(true);
          }, REFRESH_TABLE_DELAY);
        }
      }),
      map((res) => res.data)
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
}
