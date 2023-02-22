import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';


@Component({
	templateUrl: './firebase-email-verification.component.html',
	styleUrls: [],
	selector: 'app-email-verification',
})
export class FirebaseEmailVerificationComponent implements OnInit {
	constructor(private authService: FirebaseAuthService, private snackbarService: MatSnackBar) { }
	@Input() email!: string;
	@Input() resetPasswordNote = false;
	loading = false;
	resendVerification$!: Observable<void>;
	sendPasswordReset$!: Observable<void>;

	ngOnInit(): void { }
	resendVerification() {
		if (!this.loading) {
			this.loading = true;
			this.resendVerification$ = this.authService.SendVerificationMail().pipe(map(() => void 0),
				tap(() => {
					this.snackbarService.open("Verification Resent");
					this.loading = false;
				}));
		}
	}
	sendPasswordReset() {
		if (!this.loading) {
			this.loading = true;
			this.sendPasswordReset$ = this.authService.sendPasswordReset(this.email).pipe(map(() => void 0),
				tap(() => {
					this.snackbarService.open("Password Reset Resent");
					this.loading = false;
				}));
		}
	}
}
