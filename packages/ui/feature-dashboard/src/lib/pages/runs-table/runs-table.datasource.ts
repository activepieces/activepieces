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
} from 'rxjs';
import { FlowRun } from '@activepieces/shared';
import {
  InstanceRunService,
  ApPaginatorComponent,
  ProjectSelectors,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class RunsTableDataSource extends DataSource<FlowRun> {
  data: FlowRun[] = [];
  constructor(
    private pageSize$: Observable<number>,
    private pageCursor$: Observable<string>,
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
      pageCursor: this.pageCursor$,
      pageSize: this.pageSize$,
      project: this.store.select(ProjectSelectors.selectProject).pipe(take(1)),
    }).pipe(
      switchMap((res) => {
        return this.instanceRunService.list(res.project.id, {
          limit: res.pageSize,
          cursor: res.pageCursor,
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
