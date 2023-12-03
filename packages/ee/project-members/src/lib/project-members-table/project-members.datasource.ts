import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  BehaviorSubject,
  catchError,
  of,
} from 'rxjs';
import { ProjectMember } from '@activepieces/ee-shared';
import { ProjectMemberService } from '../service/project-members.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectMembersTableDataSource extends DataSource<ProjectMember> {
  data: ProjectMember[] = [];
  public isLoading$ = new BehaviorSubject(false);
  constructor(
    private projectMemberService: ProjectMemberService,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connects this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<ProjectMember[]> {
    return combineLatest({
      refresh: this.refresh$,
    }).pipe(
      switchMap(() => {
        return this.projectMemberService.list({}).pipe(
          catchError((e: any) => {
            console.error(e);
            return of({
              next: undefined,
              previous: undefined,
              data: [],
            });
          })
        );
      }),
      tap((members) => {
        this.data = members.data;
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
