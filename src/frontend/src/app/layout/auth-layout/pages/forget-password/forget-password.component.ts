import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-forget-password',
	templateUrl: './forget-password.component.html',
	styleUrls: ['./forget-password.component.scss'],
	animations: [fadeInUp400ms],
})
export class ForgetPasswordComponent implements OnInit {
	forgotPasswordForm: FormGroup;
	showErrorMessage = false;
	submitted = false;
	loading = false;
	email: string;

	constructor(
		private themeService: ThemeService,
		private formBuilder: FormBuilder,
		private navigationService: NavigationService,
		private authenticationService: AuthenticationService
	) {
		this.forgotPasswordForm = this.formBuilder.group({
			email: [, [Validators.email, Validators.required]],
		});
	}

	ngOnInit(): void {
		this.navigationService.setTitle('Forget Password');
	}

	delayLoading() {
		setTimeout(() => {
			this.loading = false;
		}, this.themeService.DELAY_LOADING_DURATION);
	}

	sendPasswordReset() {
		this.submitted = true;
		if (this.forgotPasswordForm.invalid) {
			return;
		}
		this.loading = true;
		this.authenticationService.sendResetPasswordEmail(this.forgotPasswordForm.value).subscribe({
			next: () => {
				if (!this.email) {
					this.loading = false;
				}
				this.email = this.forgotPasswordForm.value.email;
				this.delayLoading();
			},
			error: err => {
				console.log(err);
				this.delayLoading();
			},
		});
	}
}
