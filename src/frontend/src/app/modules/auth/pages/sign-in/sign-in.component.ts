import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../../../common/service/authentication.service';
import { fadeInUp400ms } from '../../../common/animation/fade-in-up.animation';
import { catchError, map, Observable, tap } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
interface SignInForm {
	email: FormControl<string>;
	password: FormControl<string>;
}
@Component({
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss'],
	animations: [fadeInUp400ms],
})
export class SignInComponent {
	loginForm: FormGroup<SignInForm>;
	showInvalidEmailOrPasswordMessage = false;
	loading = false;
	authenticate$: Observable<void>;
	constructor(
		private router: Router,
		private formBuilder: FormBuilder,
		private authenticationService: AuthenticationService
	) {
		this.loginForm = this.formBuilder.group({
			email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
			password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
		});
	}

	signIn(): void {
		if (this.loginForm.valid && !this.loading) {
			this.loading = true;
			this.showInvalidEmailOrPasswordMessage = false;
			const request = this.loginForm.getRawValue();
			this.authenticate$ = this.authenticationService.signIn(request).pipe(
				catchError((error: HttpErrorResponse) => {
					if (error.status === StatusCodes.UNAUTHORIZED || error.status === StatusCodes.BAD_REQUEST) {
						this.showInvalidEmailOrPasswordMessage = true;
					}
					this.loading = false;
					throw error;
				}),
				tap(response => {
					this.authenticationService.saveUser(response);
					this.router.navigate(['/']);
				}),
				map(() => void 0)
			);
		}
	}
}
