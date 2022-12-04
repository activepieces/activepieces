import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { User } from '../../../common-layout/model/user.interface';
import { StatusCodes } from 'http-status-codes';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-reset-password',
	templateUrl: './reset-password.component.html',
	styleUrls: ['./reset-password.component.scss'],
	animations: [fadeInUp400ms],
})
export class ResetPasswordComponent implements OnInit {
	resetPasswordForm: FormGroup;
	submitted = false;
	invalidTokenMessage = false;
	loading = false;

	constructor(
		private router: Router,
		private formBuilder: FormBuilder,
		private activatedRoute: ActivatedRoute,
		private navigationService: NavigationService,
		private themeService: ThemeService,
		private authenticationService: AuthenticationService
	) {
		this.resetPasswordForm = this.formBuilder.group(
			{
				newPassword: [
					,
					[
						Validators.required,
						Validators.minLength(8),
						Validators.maxLength(64),
						Validators.pattern('^((?=.*\\d)(?=.*[A-Za-z])(?=.*\\W).{3,})$'),
					],
				],
				confirmPassword: [, [Validators.required]],
				token: [, [Validators.required]],
			},
			{ validators: this.checkPasswords }
		);
	}

	checkPasswords: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
		const pass = group.get('newPassword')?.value;
		const confirmPass = group.get('confirmPassword')?.value;
		return pass === confirmPass ? null : { passwordMatch: true };
	};

	ngOnInit() {
		this.navigationService.setTitle('Reset Password');
		this.activatedRoute.params.subscribe(value => {
			this.resetPasswordForm.controls['token'].setValue(value['token']);
		});
	}

	delayLoading() {
		setTimeout(() => {
			this.loading = false;
		}, this.themeService.DELAY_LOADING_DURATION);
	}

	resetPassword(): void {
		this.submitted = true;
		if (this.resetPasswordForm.valid) {
			this.loading = true;
			this.invalidTokenMessage = false;
			const request = this.resetPasswordForm.value;
			this.authenticationService.changePassword(request).subscribe({
				next: (response: HttpResponse<User>) => {
					this.authenticationService.saveUser(response);
					this.router.navigate(['/']);
					this.loading = false;
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
					if (error.status === StatusCodes.UNAUTHORIZED) {
						this.invalidTokenMessage = true;
					}
					this.delayLoading();
				},
			});
		}
	}
}
