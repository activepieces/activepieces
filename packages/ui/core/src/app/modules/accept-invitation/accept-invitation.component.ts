import { UiCommonModule, UserInvitationService } from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-accept-invitation',
  templateUrl: './accept-invitation.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [UiCommonModule],
})
export class AcceptInvitationComponent implements OnInit {
  acceptInvitation$: Observable<void> | undefined;
  invalidToken = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userInvitationService: UserInvitationService
  ) {}

  ngOnInit(): void {
    this.acceptInvitation$ = this.activatedRoute.queryParams.pipe(
      switchMap((query) => {
        return this.userInvitationService.accept({
          invitationToken: query['token'],
        });
      }),
      tap((value) => {
        if (!this.invalidToken) {
          if (!value.registered) {
            this.redirectToSignUp();
          } else {
            this.router.navigate(['/sign-in']);
          }
        }
      }),
      map(() => undefined),
      catchError((e) => {
        console.error(e);
        this.invalidToken = true;
        return of(undefined);
      })
    );
  }

  redirectToSignUp() {
    // Add any necessary logic before redirecting, if needed
    setTimeout(() => {
      const email = this.activatedRoute.snapshot.queryParamMap.get('email');
      this.router.navigate(['/sign-up'], { queryParams: { email } });
    }, 3000);
  }
}
