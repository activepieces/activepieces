import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../../../common/service/authentication.service';
import { fadeInUp400ms } from '../../../common/animation/fade-in-up.animation';
import { NavigationService } from '../../../dashboard/service/navigation.service';
import { catchError, mapTo, Observable, tap } from 'rxjs';
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
export class SignInComponent implements OnInit {
	loginForm: FormGroup<SignInForm>;
	submitted = false;
	showInvalidEmailOrPasswordMessage = false;
	loading = false;
	authenticate$: Observable<void>;
	constructor(
		private router: Router,

		private formBuilder: UntypedFormBuilder,
		private navigationService: NavigationService,
		private authenticationService: AuthenticationService
	) {
		this.loginForm = this.formBuilder.group({
			email: [, [Validators.email, Validators.required]],
			password: [, Validators.required],
		});
	}

	ngOnInit() {
		this.navigationService.setTitle('Sign In');
	}

	signIn(): void {
		this.submitted = true;
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

				mapTo(void 0)
			);
		}
	}
}
