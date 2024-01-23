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
import { Platform } from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';

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
  platform: Platform;
  displayedColumns = [
    'email',
    'name',
    'created',
    'updated',
    'status',
    'action',
  ];
  isDemo = false;
  constructor(
    private platformService: PlatformService,
    private snackBar: MatSnackBar,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute
  ) {
    this.platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
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
