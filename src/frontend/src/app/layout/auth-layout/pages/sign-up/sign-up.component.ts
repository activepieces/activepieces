import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-sign-up',
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.scss'],
	animations: [fadeInUp400ms],
})
export class SignUpComponent implements OnInit {
	signUpForm: FormGroup;
	submitted = false;
	loading = false;
	emailExists: boolean;
	email: any;
	activeStep = 0;
	emailChanged = false;
	constructor(
		private formBuilder: FormBuilder,
		private navigationService: NavigationService,
		private authenticationService: AuthenticationService
	) {
		this.signUpForm = this.formBuilder.group({
			email: [, [Validators.email, Validators.pattern('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'), Validators.required]],
		});
	}

	ngOnInit(): void {
		this.navigationService.setTitle('Sign Up');
	}

	sendEmailReset() {
		this.submitted = true;
		if (this.signUpForm.valid && !this.loading) {
			this.loading = true;
			this.emailExists = false;
			this.emailChanged = false;
			const request = this.signUpForm.value;
			this.email = request.email;
			this.authenticationService.sendEmailVerification(request).subscribe({
				next: (response: HttpResponse<void>) => {
					this.activeStep = 1;
					this.loading = false;
				},
				error: (error: HttpErrorResponse) => {
					if (error.status === StatusCodes.UNAUTHORIZED || error.status === StatusCodes.BAD_REQUEST) {
					}
					if (error.status === StatusCodes.CONFLICT) {
						this.emailExists = true;
					}
					this.loading = false;
				},
			});
		}
	}
}
