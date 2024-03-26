import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';
import { combineLatest, of } from 'rxjs';
import { Project, ProjectWithLimits } from '@activepieces/shared';
import {
  ApPaginatorComponent,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  PlatformProjectService,
} from '@activepieces/ui/common';
import { Params } from '@angular/router';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectsDataSource extends DataSource<Project> {
  data: Project[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private projectService: PlatformProjectService,
    private refresh$: Observable<boolean>,
    private paginator: ApPaginatorComponent,
    private queryParams$: Observable<Params>,
    private isDemo: boolean
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<ProjectWithLimits[]> {
    if (this.isDemo) {
      return of([]);
    }
    return combineLatest([this.refresh$, this.queryParams$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(([_refresh, queryParams]) =>
        this.projectService.list({
          cursor: queryParams[CURSOR_QUERY_PARAM] ?? null,
          limit: queryParams[LIMIT_QUERY_PARAM] ?? 10,
        })
      ),
      tap((page) => {
        console.log(page);
        this.data = page.data;
        this.paginator.setNextAndPrevious(page.next, page.previous);
        this.isLoading$.next(false);
      }),
      map((page) => page.data)
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
