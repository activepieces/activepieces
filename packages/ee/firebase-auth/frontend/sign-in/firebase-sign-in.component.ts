import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { FirebaseAuthService } from '../firebase-auth.service';
import { fadeInUp400ms } from 'packages/frontend/src/app/modules/common/animation/fade-in-up.animation';
import { AuthenticationService } from '@frontend/modules/common/service/authentication.service';
import * as auth from 'firebase/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseError } from 'firebase/app';


interface LoginForm {
	email: FormControl<string>;
	password?: FormControl<string>;
}

@Component({
	templateUrl: './firebase-sign-in.component.html',
	styleUrls: [],
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
	loginForm!: FormGroup<LoginForm>;
	constructor(private router: Router, private firebaseAuthService: FirebaseAuthService, private authService: AuthenticationService) {
		this.loginForm = new FormGroup<LoginForm>({
			email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
			password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
		});
	}

	signIn(): void {
		this.showEmailNotVerifiedMessage = false;
		this.showInvalidEmailOrPasswordMessage = false;
		if (this.loginForm.valid && !this.loading) {
			this.loading = true;
			this.showErrorMessage = false;
			this.signIn$ = this.firebaseAuthService.SignIn(this.loginForm.value.email!, this.loginForm.value.password!).pipe(
				switchMap(res => {
					if (!res.user?.emailVerified) {
						this.loading = false;
						this.showEmailNotVerifiedMessage = true;
						return of(null);
					} else {
						return from(res.user.getIdToken()).pipe(switchMap(idToken => {
							return this.firebaseAuthService.SignInWithAp({
								token: idToken,
							}).pipe(tap(response => {
								this.authService.saveUser(response);
								this.router.navigate(['/']);
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
		this.signInProvider$ = this.firebaseAuthService.SignInWithProvider(new auth.GithubAuthProvider()).pipe(
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
		this.signInProvider$ = this.firebaseAuthService.SignInWithProvider(new auth.GoogleAuthProvider()).pipe(
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
}
