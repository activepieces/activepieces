import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersDataSource } from './users-table.datasource';
import {
  AuthenticationService,
  GenericSnackbarTemplateComponent,
  PlatformService,
} from '@activepieces/ui/common';
import { Observable, Subject, startWith, tap } from 'rxjs';
import { UserResponse, UserStatus } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  deactivate$?: Observable<void>;
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
  constructor(
    private platformService: PlatformService,
    private snackBar: MatSnackBar,
    private authenticationService: AuthenticationService
  ) {
    this.platformOwnerId = this.authenticationService.currentUser.id;
    this.dataSource = new UsersDataSource(
      this.refresh$.asObservable().pipe(startWith(true)),
      this.platformService
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
}
