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
import { ProjectMember, ProjectMemberStatus } from '@activepieces/ee-shared';
import { ProjectMemberService } from '../service/project-members.service';
import {
  ApPaginatorComponent,
  AuthenticationService,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@activepieces/ui/common';
import { Params } from '@angular/router';
import { ProjectMemberRole } from '@activepieces/shared';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectMembersTableDataSource extends DataSource<ProjectMember> {
  data: ProjectMember[] = [];
  public isLoading$ = new BehaviorSubject(false);
  constructor(
    private authenticationService: AuthenticationService,
    private projectMemberService: ProjectMemberService,
    private refresh$: Observable<boolean>,
    private fakeData = false,
    private paginator: ApPaginatorComponent,
    private queryParams$: Observable<Params>
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
      queryParams: this.queryParams$,
    }).pipe(
      switchMap((res) => {
        if (!this.fakeData) {
          return this.projectMemberService
            .list({
              projectId: this.authenticationService.getProjectId(),
              cursor: res.queryParams[CURSOR_QUERY_PARAM],
              limit: res.queryParams[LIMIT_QUERY_PARAM],
            })
            .pipe(
              tap((res) => {
                this.paginator.setNextAndPrevious(res.next, res.previous);
              }),
              catchError((e: any) => {
                console.error(e);
                return of({
                  next: undefined,
                  previous: undefined,
                  data: [],
                });
              })
            );
        }
        const member: ProjectMember = {
          id: this.authenticationService.currentUser.id,
          created: this.authenticationService.currentUser.created,
          email: this.authenticationService.currentUser.email,
          role: ProjectMemberRole.ADMIN,
          status: ProjectMemberStatus.ACTIVE,
          projectId: this.authenticationService.getProjectId(),
          updated: this.authenticationService.currentUser.updated,
        };
        return of({
          next: undefined,
          previous: undefined,
          data: [member],
        });
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
