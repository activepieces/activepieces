import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { UpdatesService, VersionRelease } from '../../service/updates.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ReleaseDataSource extends DataSource<VersionRelease> {
  data: VersionRelease[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(private updateService: UpdatesService) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<VersionRelease[]> {
    this.isLoading$.next(true);
    return this.updateService.getReleaseNotes().pipe(
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
