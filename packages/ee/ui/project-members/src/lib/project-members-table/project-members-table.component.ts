import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import {
  AuthenticationService,
  PROJECT_ROLE_DISABLED_RESOLVER_KEY,
  ProjectService,
  UserInvitationService,
} from '@activepieces/ui/common';
import { RolesDisplayNames } from '../utils';
import { ActivatedRoute } from '@angular/router';
import { ProjectMemberRole } from '@activepieces/shared';
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
export class ProjectMembersTableComponent implements OnInit {
  dataSource!: ProjectMembersTableDataSource;
  dialogClosed$: Observable<void> | undefined;
  deleteInvitation$: Observable<void> | undefined;
  projectOwnerId$: Observable<string> | undefined;
  isCurrentUserAdmin$: Observable<boolean> | undefined;
  inviteLoading = false;
  isFeatureLocked = false;
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  displayedColumns = ['email', 'role', 'status', 'created', 'action'];
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
  ) {}
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

  get projectMemberRole() {
    return ProjectMemberRole;
  }
}
