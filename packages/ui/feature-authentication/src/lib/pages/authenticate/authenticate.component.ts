import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, fadeInUp400ms } from '@activepieces/ui/common';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  templateUrl: './authenticate.component.html',
  styleUrls: [],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationComponent {
  authenticate$: Observable<void> | undefined;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private authenticationService: AuthenticationService
  ) {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authenticationService.saveToken(token);
    }
    this.authenticate$ = this.authenticationService.me().pipe(
      map((user) => {
        this.authenticationService.updateUser({
          ...user,
          projectId: '',
          projectRole: null,
          token: token || '',
        });
        this.redirectToBack();
      }),
      catchError((err) => {
        this.snackbar.open(
          'An error occurred while authenticating user, please check your console',
          '',
          {
            duration: undefined,
            panelClass: 'error',
          }
        );
        // Handle the error here, e.g. show an error message to the user
        console.error(err);
        return of(void 0);
      })
    );
  }

  redirectToBack() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect_url');
    if (redirectUrl) {
      this.router.navigateByUrl(decodeURIComponent(redirectUrl));
    } else {
      this.router.navigate(['/flows']);
    }
  }
}
