import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import {
  AuthenticationService,
  PROJECT_ROLE_DISABLED_RESOLVER_KEY,
  ProjectService,
  TableCore,
  UserInvitationService,
  unpermittedTooltip,
} from '@activepieces/ui/common';
import { RolesDisplayNames } from '../utils';
import { ActivatedRoute } from '@angular/router';
import { Permission, ProjectMemberRole } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

export enum TeamMemberStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
}
export type UserInvitedOrMember = {
  email: string;
  role: ProjectMemberRole;
  status: TeamMemberStatus;
  created: string;
  id: string;
};

@Component({
  selector: 'app-project-members-table',
  templateUrl: './project-members-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersTableComponent extends TableCore implements OnInit {
  dataSource!: ProjectMembersTableDataSource;
  dialogClosed$: Observable<void> | undefined;
  deleteInvitation$: Observable<void> | undefined;
  projectOwnerId$: Observable<string> | undefined;
  isCurrentUserAdmin$: Observable<boolean> | undefined;
  inviteLoading = false;
  isFeatureLocked = false;
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  isReadOnly = !this.hasPermission(Permission.WRITE_INVITATION);
  readonly deleteInvitationTooltip = this.isReadOnly
    ? unpermittedTooltip
    : $localize`Delete Invitation`;
  title = $localize`Project Members`;
  RolesDisplayNames = RolesDisplayNames;
  upgradeNoteTitle = $localize`Bring Your Team`;
  upgradeNote = $localize`Invite your teammates to a project, assigning the appropriate roles and permissions for building and debugging flows.`;
  constructor(
    private projectService: ProjectService,
    private projectMemberService: ProjectMemberService,
    private userInvitationService: UserInvitationService,
    private authenticationService: AuthenticationService,
    private matsnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute
  ) {
    super({
      tableColumns: ['email', 'role', 'status', 'created', 'action'],
    });
  }
  ngOnInit(): void {
    this.isFeatureLocked = this.activatedRoute.snapshot.data[
      PROJECT_ROLE_DISABLED_RESOLVER_KEY
    ] as boolean;
    this.dataSource = new ProjectMembersTableDataSource(
      this.userInvitationService,
      this.authenticationService,
      this.projectMemberService,
      this.refreshTableAtCurrentCursor$.asObservable().pipe(startWith(true))
    );

    this.projectOwnerId$ = this.projectService.currentProject$.pipe(
      map((project) => project!.ownerId)
    );
    this.isCurrentUserAdmin$ = this.projectMemberService.isRole(
      ProjectMemberRole.ADMIN
    );
  }

  deleteInvitation(invitation: UserInvitedOrMember) {
    switch (invitation.status) {
      case TeamMemberStatus.ACTIVE:
        this.deleteInvitation$ = this.projectMemberService
          .delete(invitation.id)
          .pipe(
            tap(() => {
              this.matsnackBar.open(
                $localize`${invitation.email} is removed from the project`
              );
              this.refreshTableAtCurrentCursor$.next(true);
            })
          );
        break;
      case TeamMemberStatus.PENDING:
        this.deleteInvitation$ = this.userInvitationService
          .delete(invitation.id)
          .pipe(
            tap(() => {
              this.matsnackBar.open(
                $localize`Invitation to ${invitation.email} is removed`
              );
              this.refreshTableAtCurrentCursor$.next(true);
            })
          );
        break;
    }
  }
}
