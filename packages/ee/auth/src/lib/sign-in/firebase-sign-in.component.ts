import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';
import { FlagService, fadeInUp400ms } from '@activepieces/ui/common';
import { GoogleAuthProvider, GithubAuthProvider } from "@angular/fire/auth";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseError } from '@angular/fire/app';
import { AuthenticationService } from '@activepieces/ui/common';
import { Meta } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApFlagId } from '@activepieces/shared';
interface LoginForm {
	email: FormControl<string>;
	password?: FormControl<string>;
}

@Component({
	templateUrl: './firebase-sign-in.component.html',
	animations: [fadeInUp400ms],
})
export class FirebaseSignInComponent {
	submitted = false;
	showErrorMessage = false;
	loading = false;
	signIn$!: Observable<void>;
	signInProvider$!: Observable<void>;
	alreadyRegisteredWithAnotherProvider = false;
	showInvalidEmailOrPasswordMessage = false;
	showEmailNotVerifiedMessage = false;
	unverifiedUser: firebase.default.auth.UserCredential | undefined;
	loginForm!: FormGroup<LoginForm>;
	showAuthProvider$: Observable<boolean>;
	saveReferreringUserId$!: Observable<void>;
	constructor(private router: Router, private route: ActivatedRoute, private meta: Meta,
		private snackBar: MatSnackBar,
		private flagsService: FlagService,
		private firebaseAuthService: FirebaseAuthService,
		private authService: AuthenticationService) {
		this.meta.addTag({
			content: "Login to your account with Activepieces. Activepieces is an open source no-code business automation tool. Automate Slack, Notion, Airtable, Google Sheets and ChatGPT together.",
			name: "description"
		});
		this.showAuthProvider$ = this.flagsService.isFlagEnabled(ApFlagId.SHOW_AUTH_PROVIDERS);
		this.loginForm = new FormGroup<LoginForm>({
			email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
			password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
		});
		this.saveReferreringUserId$ = this.route.queryParams.pipe(
			tap((q) => {
				if (q['referral']) {
					this.firebaseAuthService.saveReferringUserId(q['referral']);
				}
			}),
			map(() => void 0)
		);
	}

	signIn(): void {
		this.unverifiedUser = undefined;
		this.showEmailNotVerifiedMessage = false;
		this.showInvalidEmailOrPasswordMessage = false;
		if (this.loginForm.valid && !this.loading) {
			this.loading = true;
			this.showErrorMessage = false;
			this.signIn$ = this.firebaseAuthService.signIn(this.loginForm.value.email!, this.loginForm.value.password!).pipe(
				switchMap(res => {
					if (!res.user?.emailVerified) {
						this.loading = false;
						this.showEmailNotVerifiedMessage = true;
						this.unverifiedUser = res;
						return of(null);
					} else {
						return from(res.user.getIdToken()).pipe(switchMap(idToken => {
							return this.firebaseAuthService.signInWithAp({
								token: idToken as string,
							}).pipe(tap(response => {
								this.authService.saveUser(response);
								this.redirectToBack();
							}))
						}));
					}
				}),
				catchError((err: FirebaseError) => {
					if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
						this.showInvalidEmailOrPasswordMessage = true;
						this.loading = false;
					} else {
						throw err;
					}
					return of(null);
				}),
				map(() => void 0)
			);
		}
	}

	signInGithub() {
		this.signInProvider$ = this.firebaseAuthService.SignInWithProvider(new GithubAuthProvider()).pipe(
			tap(response => {
				console.log(response);
				if (response) {
					this.authService.saveUser(response);
					this.redirectToBack();
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
					this.redirectToBack();
				} else {
					this.alreadyRegisteredWithAnotherProvider = true;
				}
			}),
			map(() => void 0)
		);
	}

	forgetPassword() {
		this.router.navigate(['/forgot-password'], { queryParams: { redirect_url: this.route.snapshot.queryParamMap.get('redirect_url') } });
	}

	signUp() {
		this.router.navigate(['/sign-up'], { queryParams: { redirect_url: this.route.snapshot.queryParamMap.get('redirect_url') } });
	}

	redirectToBack() {
		const redirectUrl = this.route.snapshot.queryParamMap.get('redirect_url');
		if (redirectUrl) {
			this.router.navigateByUrl(decodeURIComponent(redirectUrl));
		} else {
			this.router.navigate(['/flows']);
		}
	}
	resendVerificationEmail() {
		if (this.unverifiedUser) {
			this.unverifiedUser.user?.sendEmailVerification();
			this.unverifiedUser = undefined;
			this.snackBar.open("Verfication email resent");
		}
	}
}
