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
import { UnhandledSwitchCaseError } from '@activepieces/shared';

export type ProjectMemberWithUiData = ProjectMember & {
  statusText: string;
  statusTooltip: string;
};
/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectMembersTableDataSource extends DataSource<ProjectMember> {
  data: ProjectMemberWithUiData[] = [];
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
  connect(): Observable<ProjectMemberWithUiData[]> {
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
      map((res) => {
        const members = res.data.map((pm) => {
          return {
            ...pm,
            statusText: getStatusText(pm.status),
            statusTooltip: getStatusTooltip(pm.status),
          };
        });
        return members;
      }),
      tap((members) => {
        this.data = members;
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

const getStatusText = (status: ProjectMemberStatus) => {
  switch (status) {
    case ProjectMemberStatus.ACCEPTED:
      return $localize`Accepted`;
    case ProjectMemberStatus.ACTIVE:
      return $localize`Active`;
    case ProjectMemberStatus.PENDING:
      return $localize`Pending`;
  }
};
const getStatusTooltip = (status: ProjectMemberStatus) => {
  switch (status) {
    case ProjectMemberStatus.ACCEPTED:
      return $localize`User has accepted your invite, and should create account`;
    case ProjectMemberStatus.ACTIVE:
      return $localize`User is activated as a member`;
    case ProjectMemberStatus.PENDING:
      return $localize`User has been invitied, awating his acceptance`;
    default:
      throw new UnhandledSwitchCaseError(status);
  }
};
