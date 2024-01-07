import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  catchError,
  of,
  take,
  BehaviorSubject,
  filter,
} from 'rxjs';
import { ProjectSelectors } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { GitRepo } from '@activepieces/ee-shared';
import { SyncProjectService } from '../../services/sync-project.service';
/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class SyncProjectDataSource extends DataSource<GitRepo> {
  data: GitRepo[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private synProjectService: SyncProjectService,
    private store: Store
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<GitRepo[]> {
    return combineLatest({
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
        return this.synProjectService.list(res.project.id);
      }),
      catchError((err) => {
        console.error(err);
        return of([]);
      }),
      tap((res) => {
        this.isLoading$.next(false);
        this.data = res;
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
