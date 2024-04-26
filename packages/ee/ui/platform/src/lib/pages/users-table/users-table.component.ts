import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersDataSource } from './users-table.datasource';
import {
  AuthenticationService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  GenericSnackbarTemplateComponent,
} from '@activepieces/ui/common';
import { Observable, Subject, startWith, tap } from 'rxjs';
import { UserResponse, UserStatus } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EditUserDialogComponent } from '../../components/dialogs/edit-user-role-dialog/edit-user-role-dialog.component';
import { PlatformUserService } from '../../service/platform-user.service';

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
  deactivated = $localize`Inactive`;
  active = $localize`Active`;
  dataSource: UsersDataSource;
  UserStatus = UserStatus;
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
    private matDialog: MatDialog
  ) {
    this.platformOwnerId = this.authenticationService.currentUser.id;
    this.dataSource = new UsersDataSource(
      this.refresh$.asObservable().pipe(startWith(true)),
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

  deleteUser(user: UserResponse) {
    const delete$ = this.platformUserService.deleteUser(user.id).pipe(
      tap(() => {
        this.refresh$.next(true);
        this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
          data: `<b>${user.firstName} ${
            user.lastName
          }</b> ${$localize`deleted`} `,
        });
      })
    );
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: delete$,
      entityName: user.firstName + ' ' + user.lastName,
      note: $localize`Are you sure you want to <b> delete ${user.firstName} ${user.lastName} </b>?`,
    };
    this.delete$ = this.matDialog
      .open(DeleteEntityDialogComponent, {
        data: dialogData,
      })
      .afterClosed();
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
