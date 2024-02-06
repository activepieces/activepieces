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
import { CustomDomain } from '@activepieces/shared';
import { CustomDomainService } from '../../service/custom-domain.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class CustomDomainDataSource extends DataSource<CustomDomain> {
  data: CustomDomain[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private refresh$: Observable<boolean>,
    private customDomainService: CustomDomainService,
    private fakeData: boolean
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<CustomDomain[]> {
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
        return this.customDomainService.list().pipe(map((res) => res.data));
      }),
      tap((res) => {
        this.data = res;
        this.isLoading$.next(false);
      })
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
