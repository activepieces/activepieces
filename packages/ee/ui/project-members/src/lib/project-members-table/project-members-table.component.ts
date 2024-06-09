import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import {
  ApPaginatorComponent,
  AuthenticationService,
  PROJECT_ROLE_DISABLED_RESOLVER_KEY,
  ProjectService,
} from '@activepieces/ui/common';
import { RolesDisplayNames } from '../utils';
import { ActivatedRoute } from '@angular/router';
import { ProjectMemberRole } from '@activepieces/shared';

@Component({
  selector: 'app-project-members-table',
  templateUrl: './project-members-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
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
  upgradeNote = $localize`Invite your teammates with the right roles and permissions to collaborate on building flows and debugging them`;

  constructor(
    private projectService: ProjectService,
    private projectMemberService: ProjectMemberService,
    private authenticationService: AuthenticationService,
    private activatedRoute: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.isFeatureLocked = this.activatedRoute.snapshot.data[
      PROJECT_ROLE_DISABLED_RESOLVER_KEY
    ] as boolean;
    this.dataSource = new ProjectMembersTableDataSource(
      this.authenticationService,
      this.projectMemberService,
      this.refreshTableAtCurrentCursor$.asObservable().pipe(startWith(true)),
      this.isFeatureLocked,
      this.paginator,
      this.activatedRoute.queryParams
    );

    this.projectOwnerId$ = this.projectService.currentProject$.pipe(
      map((project) => project!.ownerId)
    );
    this.isCurrentUserAdmin$ = this.projectMemberService.isRole(
      ProjectMemberRole.ADMIN
    );
  }

  openInviteMember() {
    if (this.inviteLoading) {
      return;
    }
    // TODO URGENT FIX
  }

  deleteInvitation(invitationId: string) {
    this.deleteInvitation$ = this.projectMemberService
      .delete(invitationId)
      .pipe(
        tap(() => {
          this.refreshTableAtCurrentCursor$.next(true);
        })
      );
  }

  get projectMemberRole() {
    return ProjectMemberRole;
  }
}
