import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  tap,
  map,
  BehaviorSubject,
  catchError,
  of,
  forkJoin,
  switchMap,
} from 'rxjs';
import {
  AuthenticationService,
  UserInvitationService,
} from '@activepieces/ui/common';
import {
  UserInvitedOrMember,
  TeamMemberStatus,
} from './project-members-table.component';
import { InvitationType, UserInvitation } from '@activepieces/shared';
import { ProjectMemberService } from '../service/project-members.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ProjectMembersTableDataSource extends DataSource<UserInvitedOrMember> {
  data: UserInvitedOrMember[] = [];
  public isLoading$ = new BehaviorSubject(false);
  constructor(
    private userInvitedService: UserInvitationService,
    private authentticationService: AuthenticationService,
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
  connect(): Observable<UserInvitedOrMember[]> {
    return this.refresh$.pipe(
      switchMap(() =>
        forkJoin({
          projectInvitations: this.userInvitedService.list({
            type: InvitationType.PROJECT,
            limit: 1000,
          }),
          projectMembers: this.projectMemberService.list({
            limit: 1000,
            projectId: this.authentticationService.getProjectId(),
          }),
        })
      ),
      tap(({ projectInvitations, projectMembers }) => {
        const invitations = projectInvitations.data.map(
          (member: UserInvitation) => {
            return {
              email: member.email,
              role: member.projectRole!,
              status: TeamMemberStatus.PENDING,
              created: member.created,
              id: member.id,
            };
          }
        );
        const members = projectMembers.data.map((member) => {
          return {
            email: member.user.email,
            role: member.role,
            status: TeamMemberStatus.ACTIVE,
            created: member.created,
            id: member.id,
          };
        });
        this.data = [...invitations, ...members];
      }),
      catchError((e: any) => {
        console.error(e);
        return of([]);
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
