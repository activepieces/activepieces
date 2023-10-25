import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap } from 'rxjs';
import { combineLatest } from 'rxjs';
import { ProjectService } from '@activepieces/ui/common';
import { Project } from '@activepieces/shared';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectsDataSource extends DataSource<Project> {
  data: Project[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private projectService: ProjectService,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<Project[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => this.projectService.list()),
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
