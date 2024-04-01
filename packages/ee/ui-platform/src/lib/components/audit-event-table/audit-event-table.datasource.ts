import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';
import { combineLatest } from 'rxjs';
import { AuditEventService } from '../../service/audit-event-service';
import { ApplicationEvent } from '@activepieces/ee-shared';
import {
  ApPaginatorComponent,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@activepieces/ui/common';
import { Params } from '@angular/router';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class AuditEventDataSource extends DataSource<ApplicationEvent> {
  data: ApplicationEvent[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private refresh$: Observable<boolean>,
    private auditEventService: AuditEventService,
    private paginator: ApPaginatorComponent,
    private queryParams$: Observable<Params>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<ApplicationEvent[]> {
    return combineLatest([this.refresh$, this.queryParams$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(([_refresh, queryParams]) => {
        return this.auditEventService.list({
          cursor: queryParams[CURSOR_QUERY_PARAM] ?? null,
          limit: queryParams[LIMIT_QUERY_PARAM] ?? 10,
        });
      }),
      tap((res) => {
        this.data = res.data;
        this.paginator.setNextAndPrevious(res.next, res.previous);
        this.isLoading$.next(false);
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
