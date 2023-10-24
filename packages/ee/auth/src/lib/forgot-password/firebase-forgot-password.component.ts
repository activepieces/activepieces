import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { catchError, mapTo, Observable, of, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
	templateUrl: './firebase-forgot-password.component.html',
	styleUrls: [],
})
export class FirebaseForgotPasswordComponent {
	loading = false;
	showVerificationNote = false;
	emailFormControl: FormControl<string>;
	sendPasswordReset$!: Observable<void>;
	constructor(private authService: FirebaseAuthService, private activatedRoute: ActivatedRoute) {
		this.emailFormControl = new FormControl('', { nonNullable: true, validators:  [Validators.email, Validators.required]});
	}

	sendPasswordReset() {
		if (!this.loading && !this.emailFormControl.invalid) {
			this.loading = true;
			const redirectUrl = this.activatedRoute.snapshot.queryParams['redirect_url'];
			this.sendPasswordReset$ = this.authService.sendPasswordReset(this.emailFormControl.value, redirectUrl).pipe(
				tap(() => {
					this.loading = false;
					this.showVerificationNote = true;
				}),
				catchError(err => {
					this.showVerificationNote = true;
					return of(null);
				}),
				mapTo(void 0)
			);
		}
	}
}
