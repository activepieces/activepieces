import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  catchError,
  of,
  BehaviorSubject,
  map,
} from 'rxjs';
import {
  ApPaginatorComponent,
  DEFAULT_PAGE_SIZE,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
} from '@activepieces/ui/common';
import { Params } from '@angular/router';
import { Issue } from '@activepieces/ee-shared';
import { IssuesService } from '../../services/issues.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class IssuesDataSource extends DataSource<Issue> {
  data: Issue[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private queryParams$: Observable<Params>,
    private paginator: ApPaginatorComponent,
    private issueService: IssuesService,
    private projectId: string,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<Issue[]> {
    return combineLatest({
      queryParams: this.queryParams$,
      refresh: this.refresh$,
    }).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap((res) => {
        const limit = res.queryParams[LIMIT_QUERY_PARAM] || DEFAULT_PAGE_SIZE;
        const cursor = res.queryParams[CURSOR_QUERY_PARAM] || '';
        return this.issueService.list({
          projectId: this.projectId,
          limit: limit,
          cursor: cursor,
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
}
