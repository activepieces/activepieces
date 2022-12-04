import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StatusCodes } from 'http-status-codes';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { User } from '../../../common-layout/model/user.interface';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-login',
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss'],
	animations: [fadeInUp400ms],
})
export class SignInComponent implements OnInit {
	loginForm: FormGroup;
	submitted = false;
	showErrorMessage = false;
	loading = false;

	constructor(
		private router: Router,
		private formBuilder: FormBuilder,
		private navigationService: NavigationService,
		private themeService: ThemeService,
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

	delayLoadingSpinner() {
		setTimeout(() => {
			this.loading = false;
		}, this.themeService.DELAY_LOADING_DURATION);
	}

	signIn(): void {
		this.submitted = true;
		if (this.loginForm.valid && !this.loading) {
			this.loading = true;
			this.showErrorMessage = false;
			const request = this.loginForm.value;
			this.authenticationService.signIn(request).subscribe({
				next: (response: HttpResponse<User>) => {
					this.authenticationService.saveUser(response);
					this.router.navigate(['/']).then(() => {
						this.loading = false;
					});
				},
				error: (error: HttpErrorResponse) => {
					if (error.status === StatusCodes.UNAUTHORIZED || error.status === StatusCodes.BAD_REQUEST) {
						this.showErrorMessage = true;
					}
					this.delayLoadingSpinner();
				},
			});
		}
	}
}
