import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { catchError, mapTo, Observable, of, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';

@Component({
	templateUrl: './firebase-forgot-password.component.html',
	styleUrls: [],
})
export class FirebaseForgotPasswordComponent {
	loading = false;
	showVerificationNote = false;
	emailFormControl: FormControl<string>;
	sendPasswordReset$!: Observable<void>;
	constructor(private authService: FirebaseAuthService) {
		this.emailFormControl = new FormControl('', { nonNullable: true, validators: Validators.required });
	}

	sendPasswordReset() {
		if (!this.loading && !this.emailFormControl.invalid) {
			this.loading = true;
			this.sendPasswordReset$ = this.authService.sendPasswordReset(this.emailFormControl.value).pipe(
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
