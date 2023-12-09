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
  filter,
} from 'rxjs';
import { FlowRun } from '@activepieces/shared';
import {
  InstanceRunService,
  ApPaginatorComponent,
  ProjectSelectors,
  DEFAULT_PAGE_SIZE,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
  STATUS_QUERY_PARAM,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { Params } from '@angular/router';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class RunsTableDataSource extends DataSource<FlowRun> {
  data: FlowRun[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private queryParams$: Observable<Params>,
    private paginator: ApPaginatorComponent,
    private store: Store,
    private instanceRunService: InstanceRunService
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
      //wait till projects are loaded
      project: this.store
        .select(ProjectSelectors.selectCurrentProject)
        .pipe(filter((project) => !!project))
        .pipe(take(1)),
    }).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap((res) => {
        return this.instanceRunService.list(res.project.id, {
          status: res.queryParams[STATUS_QUERY_PARAM],
          limit: res.queryParams[LIMIT_QUERY_PARAM] || DEFAULT_PAGE_SIZE,
          cursor: res.queryParams[CURSOR_QUERY_PARAM],
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
        this.paginator.next = res.next;
        this.paginator.previous = res.previous;
        this.data = res.data;
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
