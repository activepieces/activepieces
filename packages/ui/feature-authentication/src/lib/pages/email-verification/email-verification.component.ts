import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, tap } from 'rxjs';
import { AuthenticationService } from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';

@Component({
  templateUrl: './email-verification.component.html',
  styleUrls: [],
  selector: 'app-email-verification',
})
export class EmailVerificationComponent {
  constructor(
    private authService: AuthenticationService,
    private snackbarService: MatSnackBar
  ) {}
  @Input({ required: true }) email = '';
  @Input() resetPasswordNote = false;
  loading = false;
  resendVerification$!: Observable<void>;
  sendPasswordReset$!: Observable<void>;

  resendVerification() {
    if (!this.loading) {
      this.loading = true;
      this.resendVerification$ = this.authService
        .sendOtpEmail({
          email: this.email,
          type: OtpType.EMAIL_VERIFICATION,
        })
        .pipe(
          map(() => void 0),
          tap(() => {
            this.snackbarService.open('Verification Resent');
            this.loading = false;
          })
        );
    }
  }
  sendPasswordReset() {
    if (!this.loading) {
      this.loading = true;
      this.sendPasswordReset$ = this.authService
        .sendOtpEmail({
          email: this.email,
          type: OtpType.PASSWORD_RESET,
        })
        .pipe(
          map(() => void 0),
          tap(() => {
            this.snackbarService.open('Password Reset Resent');
            this.loading = false;
          })
        );
    }
  }
}
