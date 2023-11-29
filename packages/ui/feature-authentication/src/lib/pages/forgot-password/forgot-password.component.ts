import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AuthenticationService } from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
import { Router } from '@angular/router';

@Component({
  templateUrl: './forgot-password.component.html',
  styleUrls: [],
})
export class ForgotPasswordComponent {
  loading = false;
  readonly OtpType = OtpType;
  showVerificationNote = false;
  emailFormControl: FormControl<string>;
  sendPasswordReset$!: Observable<void>;
  readonly notFoundErrorName = 'notFound';
  constructor(
    private authService: AuthenticationService,

    private router: Router
  ) {
    this.emailFormControl = new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.required],
    });
  }

  sendPasswordReset() {
    if (!this.loading && !this.emailFormControl.invalid) {
      this.loading = true;
      this.sendPasswordReset$ = this.authService
        .sendOtpEmail({
          email: this.emailFormControl.value,
          type: OtpType.PASSWORD_RESET,
        })
        .pipe(
          catchError((err) => {
            console.error(err);
            this.loading = false;
            return of(void 0);
          }),
          tap(() => {
            this.loading = false;
            this.showVerificationNote = true;
          }),
          map(() => void 0)
        );
    }
  }
  goBackToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
