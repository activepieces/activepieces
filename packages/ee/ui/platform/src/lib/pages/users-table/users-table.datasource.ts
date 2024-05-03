import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';
import { combineLatest } from 'rxjs';
import { UserResponse } from '@activepieces/shared';
import { PlatformUserService } from '../../service/platform-user.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class UsersDataSource extends DataSource<UserResponse> {
  data: UserResponse[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private refresh$: Observable<boolean>,
    private platformUserService: PlatformUserService
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<UserResponse[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => {
        return this.platformUserService
          .listUsers()
          .pipe(map((res) => res.data));
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
