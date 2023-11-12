import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectMembersTableDataSource } from './project-members.datasource';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, Subject, map, startWith, tap, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { InviteProjectMemberDialogComponent } from '../invite-project-member-dialog/invite-project-member.component';
import {
  ProjectMemberRole,
  ProjectMemberStatus,
} from '@activepieces/ee-shared';
import { BillingService } from '@activepieces/ee-billing-ui';
import { UpgradeDialogComponent } from '@activepieces/ee-billing-ui';
import { Store } from '@ngrx/store';
import {
  AuthenticationService,
  ProjectSelectors,
} from '@activepieces/ui/common';

@Component({
  selector: 'app-project-members-table',
  templateUrl: './project-members-table.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersTableComponent {
  dataSource!: ProjectMembersTableDataSource;
  dialogClosed$: Observable<void> | undefined;
  deleteInvitation$: Observable<void> | undefined;
  projectOwnerId$: Observable<string> | undefined;
  isCurrentUserAdmin$: Observable<boolean> | undefined;
  inviteLoading = false;
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  displayedColumns = ['email', 'role', 'status', 'created', 'action'];
  title = $localize`Project Members`;
  constructor(
    private dialogRef: MatDialog,
    private billingService: BillingService,
    private store: Store,
    private projectMemberService: ProjectMemberService,
    private authenticationService: AuthenticationService
  ) {
    this.dataSource = new ProjectMembersTableDataSource(
      this.projectMemberService,
      this.refreshTableAtCurrentCursor$.asObservable().pipe(startWith(true))
    );
  }

  openInviteMember() {
    if (this.inviteLoading) {
      return;
    }
    this.inviteLoading = true;
    this.projectOwnerId$ = this.store.select(
      ProjectSelectors.selectCurrentProjectOwnerId
    );
    // TODO OPTMIZE THIS
    this.isCurrentUserAdmin$ = this.projectMemberService
      .list({
        limit: 100,
      })
      .pipe(
        map((members) => {
          return (
            members.data.find(
              (f) => this.authenticationService.currentUser.id === f.id
            )?.role === ProjectMemberRole.ADMIN
          );
        })
      );
    this.dialogClosed$ = this.billingService.checkTeamMembers().pipe(
      switchMap((billing) => {
        this.inviteLoading = false;
        if (billing.exceeded) {
          return this.dialogRef
            .open(UpgradeDialogComponent)
            .afterClosed()
            .pipe(map(() => void 0));
        }

        return this.dialogRef
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

  statusText(status: ProjectMemberStatus) {
    switch (status) {
      case ProjectMemberStatus.ACTIVE:
        return $localize`Active`;
      case ProjectMemberStatus.PENDING:
        return $localize`Pending`;
    }
  }

  get projectMemberRole() {
    return ProjectMemberRole;
  }

  get projectMemberStatus() {
    return ProjectMemberStatus;
  }
}
