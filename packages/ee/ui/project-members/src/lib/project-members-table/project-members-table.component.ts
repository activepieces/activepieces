import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, Subject, map, startWith, tap, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { InviteProjectMemberDialogComponent } from '../dialogs/invite-project-member-dialog/invite-project-member.component';
import { ProjectMemberStatus } from '@activepieces/ee-shared';
import { BillingService, UpgradeDialogData } from 'ee-billing-ui';
import { UpgradeDialogComponent } from 'ee-billing-ui';
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
  StatusDisplayNames: { [k: string]: string } = {
    [ProjectMemberStatus.ACTIVE]: $localize`Active`,
    [ProjectMemberStatus.PENDING]: $localize`Pending`,
  };

  constructor(
    private matDialog: MatDialog,
    private billingService: BillingService,
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
    this.inviteLoading = true;
    this.dialogClosed$ = this.billingService.checkTeamMembers().pipe(
      switchMap((billing) => {
        this.inviteLoading = false;
        if (billing.exceeded) {
          const data: UpgradeDialogData = {
            limitType: 'team',
            limit: billing.limit,
          };
          return this.matDialog
            .open(UpgradeDialogComponent, { data })
            .afterClosed()
            .pipe(map(() => void 0));
        }

        return this.matDialog
          .open(InviteProjectMemberDialogComponent)
          .afterClosed()
          .pipe(
            tap(() => {
              this.refreshTableAtCurrentCursor$.next(true);
            }),
            map(() => void 0)
          );
      })
    );
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

  get projectMemberStatus() {
    return ProjectMemberStatus;
  }
}
