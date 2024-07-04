import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  BehaviorSubject,
  tap,
  switchMap,
  map,
  forkJoin,
} from 'rxjs';
import { combineLatest } from 'rxjs';
import {
  PlatformUserService,
  UserInvitationService,
} from '@activepieces/ui/common';
import {
  UserOrInvitationRow,
  UserOrInvitedRowStatus,
} from './users-table.component';
import { InvitationType, UserStatus } from '@activepieces/shared';

export class UsersDataSource extends DataSource<UserOrInvitationRow> {
  data: UserOrInvitationRow[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private refresh$: Observable<boolean>,
    private userInvitationService: UserInvitationService,
    private platformUserService: PlatformUserService
  ) {
    super();
  }

  connect(): Observable<UserOrInvitationRow[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => {
        return forkJoin({
          invitations: this.userInvitationService
            .list({
              limit: 1000,
              type: InvitationType.PLATFORM,
              cursor: undefined,
            })
            .pipe(
              map((res) =>
                res.data.map((invitation) => {
                  return {
                    id: invitation.id,
                    email: invitation.email,
                    name: '-',
                    platformRole: invitation.platformRole!,
                    created: invitation.created,
                    status: UserOrInvitedRowStatus.INVITED,
                  };
                })
              )
            ),
          users: this.platformUserService.listUsers().pipe(
            map((res) =>
              res.data.map((user) => {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.firstName + ' ' + user.lastName,
                  platformRole: user.platformRole,
                  created: user.created,
                  status:
                    user.status === UserStatus.ACTIVE
                      ? UserOrInvitedRowStatus.ACTIVE
                      : UserOrInvitedRowStatus.INACTIVE,
                };
              })
            )
          ),
        });
      }),
      tap(({ users, invitations }) => {
        this.data = [...users, ...invitations];
        this.isLoading$.next(false);
      }),
      map(({ users, invitations }) => {
        return [...users, ...invitations];
      })
    );
  }

  disconnect(): void {
    //ignore
  }
}
