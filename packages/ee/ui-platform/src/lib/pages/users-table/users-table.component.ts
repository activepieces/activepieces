import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersDataSource } from './users-table.datasource';
import {
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
  suspend$?: Observable<void>;
  activate$?: Observable<void>;
  title = $localize`Users`;
  suspended = $localize`Suspended`;
  active = $localize`Active`;
  dataSource: UsersDataSource;
  UserStatus = UserStatus;
  refresh$ = new Subject<boolean>();
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
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new UsersDataSource(
      this.refresh$.asObservable().pipe(startWith(true)),
      this.platformService
    );
  }

  suspendUser(user: UserResponse) {
    this.suspend$ = this.platformService.suspendUser(user.id).pipe(
      tap(() => {
        this.refresh$.next(true);
        this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
          data: `<b>${user.firstName} ${
            user.lastName
          }</b> ${$localize`suspended`} `,
        });
      })
    );
  }
  activateUser(user: UserResponse) {
    this.activate$ = this.platformService.activateUser(user.id).pipe(
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
