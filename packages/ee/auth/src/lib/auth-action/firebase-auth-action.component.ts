import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, from, Observable, switchMap, tap } from 'rxjs';

import { containsSpecialCharacter, fadeInUp400ms, containsLowercaseCharacter, containsUppercaseCharacter, containsNumber } from '@activepieces/ui/common';
type FirebaseActionMode = 'resetPassword' | 'recoverEmail' | 'verifyEmail';
@Component({
	styleUrls: ['./firebase-auth-action.component.scss'],
	templateUrl: './firebase-auth-action.component.html',
	animations: [fadeInUp400ms],
})
export class FirebaseAuthActionComponent {
	mode: FirebaseActionMode;
	actionCode: string;
	actionTitle = 'Password Reset';
	passwordResetActionError = '';
	resetingPassword = false;
	resetPassword$!: Observable<void>;
	newPasswordControl = new FormControl<string>('', {
		nonNullable: true,
		validators: [
			Validators.required,
			Validators.minLength(8),
			Validators.maxLength(64),
			containsSpecialCharacter(),
			containsUppercaseCharacter(),
			containsLowercaseCharacter(),
			containsNumber(),
		],
	});
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		public afAuth: AngularFireAuth,
		private titleService: Title
	) {
		this.mode = this.activatedRoute.snapshot.queryParams['mode'];
		this.actionCode = this.activatedRoute.snapshot.queryParams['oobCode'];
		if (this.mode === 'verifyEmail') {
			this.actionTitle = 'Email Verified! ';
			this.afAuth.applyActionCode(this.actionCode);
			setTimeout(() => {
				this.redirectToBack();
			}, 3000);
			this.titleService.setTitle('Email Verified');
		}
	}

	backToSign() {
		this.router.navigate(['/sign-in'])
	}

	handlePasswordReset() {
		if (this.newPasswordControl.valid && !this.resetingPassword) {
			this.resetingPassword = true;
			this.resetPassword$ = from(this.afAuth.verifyPasswordResetCode(this.actionCode)).pipe(
				switchMap(() => {
					return from(this.afAuth.confirmPasswordReset(this.actionCode, this.newPasswordControl.value));
				}),
				tap(() => {
					this.redirectToBack();
				}),
				catchError(err => {
					if (err.code === 'auth/expired-action-code') {
						this.passwordResetActionError = 'This password reset request has been expired';
					}
					if (err.code === 'auth/invalid-action-code') {
						this.passwordResetActionError = 'Your password has already been reset';
					}
					if (err.code === 'auth/user-disabled') {
						this.passwordResetActionError = 'This account has been disabled';
					}
					if (err.code === 'auth/user-not-found') {
						this.passwordResetActionError = 'This account is not found';
					}
					if (err.code === 'auth/weak-password') {
						this.passwordResetActionError = 'This password is weak';
					}
					this.resetingPassword = false;
					throw err;
				})
			);
		}
	}

		
	redirectToBack() {
		const redirectUrl = this.activatedRoute.snapshot.queryParamMap.get('continueUrl');
		this.router.navigate(['/sign-in'], { queryParams: { redirect_url: redirectUrl} });

	}
	
	getPasswordError(errorName: string) {
		return this.newPasswordControl.getError(errorName);
	}
}