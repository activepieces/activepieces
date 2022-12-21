import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { NavigationService } from '../../../dashboard-layout/service/navigation.service';

import {
	containsLowercaseCharacter,
	containsNumber,
	containsSpecialCharacter,
	containsUppercaseCharacter,
} from 'src/app/layout/common-layout/validators';
import { mapTo, Observable, switchMap, tap } from 'rxjs';

@Component({
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.scss'],
	animations: [fadeInUp400ms],
	encapsulation: ViewEncapsulation.None,
})
export class SignUpComponent implements OnInit {
	registrationForm: FormGroup;
	submitted = false;
	loading = false;
	tokenError = false;
	emailExists = false;
	emailChanged = false;
	signUp$: Observable<void>;
	constructor(
		private formBuilder: FormBuilder,
		private router: Router,
		private navigationService: NavigationService,
		public authenticationService: AuthenticationService
	) {
		this.registrationForm = this.formBuilder.group({
			first_name: ['', [Validators.required]],
			last_name: ['', [Validators.required]],
			email: [, [Validators.email, Validators.pattern('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'), Validators.required]],
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
			track_events: [false],
			news_letter: [false],
		});
	}

	ngOnInit(): void {
		this.navigationService.setTitle('Email Registration');
	}

	signUp() {
		//WTF
		this.submitted = true;
		if (this.registrationForm.valid && !this.loading) {
			this.loading = true;
			const request = this.registrationForm.value;
			this.signUp$ = this.authenticationService.signUp(request).pipe(
				tap(response => {
					this.authenticationService.saveToken(response);
					this.authenticationService.saveUser(response);
					this.router.navigate(['/flows']);
				}),
				mapTo(void 0)
			);
		}
	}

	getPasswordError(errorName: string) {
		return this.registrationForm.get('password')?.hasError(errorName);
	}

	isPasswordInputIsFocused(passwordInputElement: HTMLInputElement) {
		return passwordInputElement == document.activeElement;
	}
}
