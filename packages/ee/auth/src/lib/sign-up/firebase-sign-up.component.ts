import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import {
	containsUppercaseCharacter,
	containsLowercaseCharacter,
	containsNumber,
	containsSpecialCharacter,
	fadeInUp400ms,
} from '@activepieces/ui/common';
import { GoogleAuthProvider, GithubAuthProvider} from "@angular/fire/auth";
import { FirebaseAuthService } from '../firebase-auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@activepieces/ui/common';
import { Meta } from '@angular/platform-browser';


export interface UserInfo {
	firstName: FormControl<string>;
	lastName: FormControl<string>;
	email: FormControl<string>;
	password: FormControl<string>;
}
@Component({
	templateUrl: './firebase-sign-up.component.html',
	styleUrls: ['./firebase-sign-up.component.scss'],
	animations: [fadeInUp400ms],
})
export class FirebaseSignUpComponent {
	registrationForm: FormGroup<UserInfo>;
	showVerificationNote = false;
	loading = false;
	emailExists = false;
	invalidEmail = false;
	signUp$!: Observable<void>;
	emailChanges$: Observable<void>;
	isEmailDefined$: Observable<boolean>;
	signInProvider$!: Observable<void>;
	saveReferreringUserId$!: Observable<void>;
	alreadyRegisteredWithAnotherProvider = false;
	constructor(private firebaseAuthService: FirebaseAuthService, private router: Router, private authService: AuthenticationService, private activatedRoute: ActivatedRoute,private meta:Meta) {
		this.meta.addTag({
			name:"description",
			content:"Create a free Activepieces account to automate your business. Activepieces is the best no-code business automation tool, a great alternative to Zapier or Workato."
		});
		this.saveReferreringUserId$ = this.activatedRoute.queryParams.pipe(
			tap((q) => {
				if (q['referral']) {
					this.firebaseAuthService.saveReferringUserId(q['referral']);
				}
			}),
			map(() => void 0)
		);

		this.registrationForm = new FormGroup<UserInfo>({
			firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
			lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
			password: new FormControl<string>('', {
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
			}),
			email: new FormControl<string>('', { nonNullable: true, validators: [Validators.email, Validators.required] }),
		});

		const emailControl = this.registrationForm.controls.email;
		this.isEmailDefined$ = this.activatedRoute.queryParams.pipe(map(q => {
			 if(q['email']){
			  this.registrationForm.controls['email'].setValue(decodeURIComponent(q['email']))
			 }
			 return !!q['email']
		  }))
		this.emailChanges$ = emailControl.valueChanges.pipe(
			tap(() => {
				if (emailControl.getError('invalidEmail') || emailControl.getError('alreadyInUse')) {
					delete emailControl.errors!['invalidEmail'];
					delete emailControl.errors!['alreadyInUse'];
					emailControl.updateValueAndValidity();
				}
			}),
			map(()=>void 0)
		);
	}

	/**
	 * > If the form is valid and the user is not already loading, then send the form data to the server
	 * and show the verification note
	 */
	signUp() {
		if (!this.registrationForm.invalid && !this.loading) {
			this.loading = true;
			const redirectUrl = this.activatedRoute.snapshot.queryParams['redirect_url'];
			this.signUp$ =  this.firebaseAuthService.signUp(this.registrationForm.getRawValue(), redirectUrl).pipe(
						tap(() => {
							this.showVerificationNote = true;
							this.loading = false;
						}),
						switchMap(res => {
							return this.authService.saveNewsLetterSubscriber(res!.email!);
						}),
						catchError(err => {
							if (err.code === 'auth/invalid-email') {
								this.registrationForm.controls.email.setErrors({ invalidEmail: true });
								this.loading = false;
								return of(null);
							} else if (err.code === 'auth/email-already-in-use') {
								this.registrationForm.controls.email.setErrors({ alreadyInUse: true });
								this.loading = false;
								return of(null);
							}
							console.error(err);
							throw new Error(err.code);
						}),
						map(()=>void 0)
					);
		}
	}

	getPasswordError(errorName: string) {
		return this.registrationForm.get('password')?.hasError(errorName);
	}
	signInGithub() {
		this.signInProvider$ = this.firebaseAuthService.SignInWithProvider(new GithubAuthProvider()).pipe(
			tap(response => {
				console.log(response);
				if (response) {
					this.authService.saveUser(response);
					this.router.navigate(['/']);
				} else {
					this.alreadyRegisteredWithAnotherProvider = true;
				}
			}),
			map(() => void 0)
		);
	}

	signInGoogle() {
		this.signInProvider$ = this.firebaseAuthService.SignInWithProvider(new GoogleAuthProvider()).pipe(
			tap(response => {
				if (response) {
					this.authService.saveUser(response);
					this.router.navigate(['/']);
				} else {
					this.alreadyRegisteredWithAnotherProvider = true;
				}
			}),
			map(() => void 0)
		);
	}

	goBackToSign(){
		this.router.navigate(['/sign-in'], { queryParams: { redirect_url: this.activatedRoute.snapshot.queryParams['redirect_url'] } });
	}
}
