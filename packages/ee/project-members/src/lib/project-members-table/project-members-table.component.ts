import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import {
  Observable,
  Subject,
  map,
  startWith,
  tap,
  switchMap,
  shareReplay,
  forkJoin,
  take,
} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { InviteProjectMemberDialogComponent } from '../dialogs/invite-project-member-dialog/invite-project-member.component';
import { ProjectMemberStatus } from '@activepieces/ee-shared';
import { BillingService, UpgradeDialogData } from '@activepieces/ee-billing-ui';
import { UpgradeDialogComponent } from '@activepieces/ee-billing-ui';
import { Store } from '@ngrx/store';
import {
  ApPaginatorComponent,
  AuthenticationService,
  IsFeatureEnabledBaseComponent,
  ProjectSelectors,
} from '@activepieces/ui/common';
import { RolesDisplayNames } from '../utils';
import { ActivatedRoute } from '@angular/router';
import { ApFlagId, ProjectMemberRole } from '@activepieces/shared';

@Component({
  selector: 'app-project-members-table',
  templateUrl: './project-members-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersTableComponent
  extends IsFeatureEnabledBaseComponent
  implements OnInit
{
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  dataSource!: ProjectMembersTableDataSource;
  dialogClosed$: Observable<void> | undefined;
  deleteInvitation$: Observable<void> | undefined;
  projectOwnerId$: Observable<string> | undefined;
  isCurrentUserAdmin$: Observable<boolean> | undefined;
  inviteLoading = false;
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  displayedColumns = ['email', 'role', 'status', 'created', 'action'];
  title = $localize`Project Members`;
  RolesDisplayNames = RolesDisplayNames;
  upgradeNote = $localize`Effortlessly invite your teammates to your project and assign them roles, allowing them to view/edit flows or check runs.`;
  StatusDisplayNames: { [k: string]: string } = {
    [ProjectMemberStatus.ACTIVE]: $localize`Active`,
    [ProjectMemberStatus.PENDING]: $localize`Pending`,
  };

  constructor(
    private matDialog: MatDialog,
    private billingService: BillingService,
    private store: Store,
    private projectMemberService: ProjectMemberService,
    private authenticationService: AuthenticationService,
    activatedRoute: ActivatedRoute
  ) {
    super(activatedRoute, ApFlagId.PROJECT_MEMBERS_ENABLED);
  }
  ngOnInit(): void {
    this.dataSource = new ProjectMembersTableDataSource(
      this.authenticationService,
      this.projectMemberService,
      this.refreshTableAtCurrentCursor$.asObservable().pipe(startWith(true)),
      !this.isFeatureEnabled,
      this.paginator,
      this.activatedRoute.queryParams
    );

    this.projectOwnerId$ = this.store
      .select(ProjectSelectors.selectCurrentProjectOwnerId)
      .pipe(take(1));
    // TODO OPTMIZE THIS and use role from centerlized place
    this.isCurrentUserAdmin$ = forkJoin([
      this.projectMemberService.list({
        limit: 100,
        projectId: this.authenticationService.getProjectId(),
      }),
      this.projectOwnerId$,
    ]).pipe(
      map(([members, ownerId]) => {
        const currentUser = this.authenticationService.currentUser;

        // Check if the current user is an admin
        const isAdmin =
          members.data.find(
            (member) =>
              currentUser.email === member.email &&
              member.platformId === currentUser.platformId
          )?.role === ProjectMemberRole.ADMIN;

        // Check if the current user is the project owner
        const isOwner = currentUser.id === ownerId;

        // Return true if the user is either an admin or the owner
        return isAdmin || isOwner;
      }),
      shareReplay(1)
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
