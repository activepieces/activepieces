import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  BehaviorSubject,
  tap,
  switchMap,
  map,
  of,
  delay,
} from 'rxjs';
import { combineLatest } from 'rxjs';
import { AuditEventService } from '../../service/audit-event-service';
import { ApplicationEvent } from '@activepieces/ee-shared';
import { ApPaginatorComponent } from '@activepieces/ui/common';

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
    private fakeData: boolean
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<ApplicationEvent[]> {
    if (this.fakeData) {
      return of(this.data).pipe(
        delay(100),
        tap(() => this.isLoading$.next(false))
      );
    }
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => {
        return this.auditEventService.list({
          limit: 10,
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
