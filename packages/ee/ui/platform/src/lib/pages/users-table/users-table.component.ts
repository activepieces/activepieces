import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersDataSource } from './users-table.datasource';
import {
  AuthenticationService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  GenericSnackbarTemplateComponent,
  PlatformUserService,
  UserInvitationService,
} from '@activepieces/ui/common';
import { Observable, Subject, startWith, tap } from 'rxjs';
import { PlatformRole, UserResponse, UserStatus } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EditUserDialogComponent } from '../../components/dialogs/edit-user-role-dialog/edit-user-role-dialog.component';

export enum UserOrInvitedRowStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type UserOrInvitationRow = {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
  created: string;
  status: UserOrInvitedRowStatus;
};

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  deactivate$?: Observable<void>;
  updateUserDialog$?: Observable<void>;
  delete$?: Observable<void>;
  activate$?: Observable<void>;
  title = $localize`Users`;
  invited = $localize`Invited`;
  deactivated = $localize`Inactive`;
  active = $localize`Active`;
  dataSource: UsersDataSource;
  UserOrInvitedRowStatus = UserOrInvitedRowStatus;
  refresh$ = new Subject<boolean>();
  platformOwnerId: string;
  displayedColumns = [
    'email',
    'name',
    'platformRole',
    'created',
    'status',
    'action',
  ];
  constructor(
    private platformUserService: PlatformUserService,
    private snackBar: MatSnackBar,
    private authenticationService: AuthenticationService,
    private userInvitationService: UserInvitationService,
    private matDialog: MatDialog
  ) {
    this.platformOwnerId = this.authenticationService.currentUser.id;
    this.dataSource = new UsersDataSource(
      this.refresh$.asObservable().pipe(startWith(true)),
      this.userInvitationService,
      this.platformUserService
    );
  }

  deactivateUser(user: UserResponse) {
    this.deactivate$ = this.platformUserService
      .updateUser(user.id, { status: UserStatus.INACTIVE })
      .pipe(
        tap(() => {
          this.refresh$.next(true);
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${user.firstName} ${
              user.lastName
            }</b> ${$localize`deactivated`} `,
          });
        })
      );
  }

  updateUser(user: UserResponse) {
    const dialogData = {
      userId: user.id,
      platformRole: user.platformRole,
    };
    this.updateUserDialog$ = this.matDialog
      .open(EditUserDialogComponent, {
        data: dialogData,
      })
      .afterClosed();
  }

  deleteUser(userRow: UserOrInvitationRow) {
    switch (userRow.status) {
      case UserOrInvitedRowStatus.INVITED: {
        this.delete$ = this.userInvitationService.delete(userRow.id).pipe(
          tap(() => {
            this.refresh$.next(true);
            this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
              data: `<b>${
                userRow.email
              }</b> ${$localize`invitation is deleted`} `,
            });
          })
        );
        break;
      }
      case UserOrInvitedRowStatus.ACTIVE:
      case UserOrInvitedRowStatus.INACTIVE: {
        const delete$ = this.platformUserService.deleteUser(userRow.id).pipe(
          tap(() => {
            this.refresh$.next(true);
            this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
              data: `<b>${userRow.name}
              }</b> ${$localize`deleted`} `,
            });
          })
        );
        const dialogData: DeleteEntityDialogData = {
          deleteEntity$: delete$,
          entityName: userRow.name,
          note: $localize`Are you sure you want to <b> delete ${userRow.name} </b>?`,
        };
        this.delete$ = this.matDialog
          .open(DeleteEntityDialogComponent, {
            data: dialogData,
          })
          .afterClosed();
        break;
      }
    }
  }

  activateUser(user: UserResponse) {
    this.activate$ = this.platformUserService
      .updateUser(user.id, { status: UserStatus.ACTIVE })
      .pipe(
        tap(() => {
          this.refresh$.next(true);
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${user.firstName} ${
              user.lastName
            }</b> ${$localize`activated`} `,
          });
        })
      );
  }

  disableDeleteButton(user: UserResponse) {
    return user.id === this.platformOwnerId;
  }
}
