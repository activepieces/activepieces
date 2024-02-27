import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap } from 'rxjs';
import { combineLatest, of } from 'rxjs';
import { Project, ProjectWithLimits } from '@activepieces/shared';
import { PlatformProjectService } from '@activepieces/ui/common';

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
    private platformId: string,
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
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => this.projectService.list(this.platformId)),
      tap((projects) => {
        this.data = projects;
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
