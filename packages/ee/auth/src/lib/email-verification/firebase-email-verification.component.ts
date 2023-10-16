import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';
import { ActivatedRoute } from '@angular/router';


@Component({
	templateUrl: './firebase-email-verification.component.html',
	styleUrls: [],
	selector: 'app-email-verification',
})
export class FirebaseEmailVerificationComponent {
	constructor(private authService: FirebaseAuthService, private snackbarService: MatSnackBar, private activatedRoute: ActivatedRoute) { }
	@Input() email!: string;
	@Input() resetPasswordNote = false;
	loading = false;
	resendVerification$!: Observable<void>;
	sendPasswordReset$!: Observable<void>;

	resendVerification() {
		const redirectUrl = this.activatedRoute.snapshot.queryParams['redirect_url'];

		if (!this.loading) {
			this.loading = true;
			this.resendVerification$ = this.authService.sendVerificationMail(redirectUrl).pipe(map(() => void 0),
				tap(() => {
					this.snackbarService.open("Verification Resent");
					this.loading = false;
				}));
		}
	}
	sendPasswordReset() {
		const redirectUrl = this.activatedRoute.snapshot.queryParams['redirect_url'];
		if (!this.loading) {
			this.loading = true;
			this.sendPasswordReset$ = this.authService.sendPasswordReset(this.email, redirectUrl).pipe(map(() => void 0),
				tap(() => {
					this.snackbarService.open("Password Reset Resent");
					this.loading = false;
				}));
		}
	}
}
