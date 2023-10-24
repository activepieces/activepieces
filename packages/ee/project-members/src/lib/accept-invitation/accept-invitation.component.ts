import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectMemberService } from '../service/project-members.service';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-accept-invitation',
  templateUrl: './accept-invitation.component.html',
  styleUrls: [],
})
export class AcceptInvitationComponent implements OnInit {
  acceptInvitation$: Observable<void> | undefined;
  invalidToken = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private projectMemberService: ProjectMemberService
  ) {}

  ngOnInit(): void {
    this.acceptInvitation$ = this.activatedRoute.queryParams.pipe(
      switchMap((query) => {
        return this.projectMemberService.accept({
          token: query['token'],
        });
      }),
      catchError((e) => {
        console.error(e);
        this.invalidToken = true;
        return of(undefined);
      }),
      tap(() => {
        if (!this.invalidToken) {
          this.redirectToSignUp();
        }
      })
    );
  }

  redirectToSignUp() {
    // Add any necessary logic before redirecting, if needed
    this.router.navigate(['/sign-up']); // Replace '/signup' with the actual route to your sign-up page
  }
}
