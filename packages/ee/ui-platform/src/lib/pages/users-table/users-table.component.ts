import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersDataSource } from './users-table.datasource';
import {
  AuthenticationService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  GenericSnackbarTemplateComponent,
  PlatformService,
} from '@activepieces/ui/common';
import { Observable, Subject, startWith, tap } from 'rxjs';
import { UserResponse, UserStatus } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  deactivate$?: Observable<void>;
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
    'created',
    'updated',
    'status',
    'action',
  ];
  isDemo = false;
  upgradeNote = $localize`View users in your platform and manage their status.`;
  constructor(
    private platformService: PlatformService,
    private snackBar: MatSnackBar,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private matDialog: MatDialog
  ) {
    this.isDemo = this.route.snapshot.data[PLATFORM_DEMO_RESOLVER_KEY];
    this.platformOwnerId = this.authenticationService.currentUser.id;
    this.dataSource = new UsersDataSource(
      this.refresh$.asObservable().pipe(startWith(true)),
      this.platformService,
      this.authenticationService,
      this.isDemo
    );
  }

  deactivateUser(user: UserResponse) {
    this.deactivate$ = this.platformService
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

  deleteUser(user: UserResponse) {
    const delete$ = this.platformService.deleteUser(user.id).pipe(
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
    this.activate$ = this.platformService
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
    return this.isDemo || user.id === this.platformOwnerId;
  }
}
