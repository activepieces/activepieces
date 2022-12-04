import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { freeMailProviders } from '../consts';
import {
	containsLowercaseCharacter,
	containsNumber,
	containsSpecialCharacter,
	containsUppercaseCharacter,
	phoneNumberValidation,
} from 'src/app/layout/common-layout/validators';
import { tap } from 'rxjs';
import { OrganizationSize } from '../../../common-layout/model/enum/organization-size';

@Component({
	selector: 'app-email-registration',
	templateUrl: './email-registration.component.html',
	styleUrls: ['./email-registration.component.scss'],
	animations: [fadeInUp400ms],
	encapsulation: ViewEncapsulation.None,
})
export class EmailRegistrationComponent implements OnInit {
	registrationForm: FormGroup;
	submitted = false;
	loading = false;
	tokenError = false;
	emailExists = false;
	activeStep = 0;
	animationDone = false;
	companySizeOptions = [
		{ label: 'Personal Use', value: OrganizationSize.PERSONAL_USE },
		{ label: '1-5 employees', value: OrganizationSize.SIZE_1_TO_5 },
		{ label: '5-10 employees', value: OrganizationSize.SIZE_5_TO_10 },
		{ label: '10-50 employees', value: OrganizationSize.SIZE_10_TO_50 },
		{ label: '50-100 employees', value: OrganizationSize.SIZE_50_TO_100 },
		{ label: 'More', value: OrganizationSize.MORE_THAN_100 },
	];
	private jwtHelperService: JwtHelperService = new JwtHelperService();

	constructor(
		private formBuilder: FormBuilder,
		private route: ActivatedRoute,
		private navigationService: NavigationService,
		public authenticationService: AuthenticationService
	) {
		this.registrationForm = this.formBuilder.group({
			firstName: ['', [Validators.required]],
			lastName: ['', [Validators.required]],
			token: ['', [Validators.required]],
			company: ['', [Validators.required]],
			password: [
				'',
				[
					Validators.required,
					Validators.minLength(8),
					Validators.maxLength(64),
					containsSpecialCharacter(),
					containsUppercaseCharacter(),
					containsLowercaseCharacter(),
					containsNumber(),
				],
			],
			companySize: [, [Validators.required]],
			phoneNumber: ['', [phoneNumberValidation()]],
		});
	}

	ngOnInit(): void {
		this.navigationService.setTitle('Email Registration');
		this.route.params.subscribe(value => {
			this.registrationForm.controls['token'].setValue(value['token']);
			const email: string = this.jwtHelperService.decodeToken(value['token'])['sub'];
			const emailDomain = email.split('@')[1];
			if (!freeMailProviders.includes(emailDomain)) {
				this.registrationForm.controls['company'].setValue(emailDomain.split('.')[0]);
			}
		});
	}

	passwordFocus(event) {
		console.log(event);
	}

	signUp() {
		//WTF
		this.submitted = true;
		if (this.registrationForm.valid && !this.loading) {
			this.loading = true;
			const request = this.registrationForm.value;
			this.authenticationService
				.signUp(request)
				.pipe(
					tap(response => {
						this.authenticationService.saveToken(response);
						this.authenticationService.saveUser(response);
					})
				)
				.subscribe({
					next: () => {
						this.activeStep = 1;
					},
					error: (error: HttpErrorResponse) => {
						console.log(error);
						this.loading = false;
						if (error.status === StatusCodes.UNAUTHORIZED) {
							this.tokenError = true;
						}
						if (error.status === StatusCodes.CONFLICT) {
							this.emailExists = true;
						}
					},
				});
		}
	}

	getPasswordError(errorName: string) {
		return this.registrationForm.get('password')?.hasError(errorName);
	}

	isPasswordInputIsFocused(passwordInputElement: HTMLInputElement) {
		return passwordInputElement == document.activeElement;
	}
	get companySizeControl() {
		return this.registrationForm.get('companySize');
	}
}
