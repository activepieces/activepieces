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
      tap(() => {
        if (!this.invalidToken) {
          this.redirectToSignUp();
        }
      }),
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
      this.router.navigate(['/sign-up']);
    }, 3000);
  }
}
