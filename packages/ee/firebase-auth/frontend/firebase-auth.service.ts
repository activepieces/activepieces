import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import * as auth from 'firebase/auth';
import { catchError, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { FirebaseSignUpRequest, FirebaseSignInRequest } from "@activepieces/ee/shared"
import { User } from '@activepieces/shared';
import { AuthenticationService } from '@activepieces/ui/common';
import { environment } from '@activepieces/ui/common';

export type RegistrationFormValue = {
	firstName?: string;
	lastName?: string;
	email?: string;
	companyName?: string;
	password?: string;
};

@Injectable({
	providedIn: 'root',
})
export class FirebaseAuthService {
	constructor(
		private http: HttpClient,
		public afAuth: AngularFireAuth, // Inject Firebase auth service
		public router: Router,
		private authenticationService: AuthenticationService
	) {
		this.authenticationService.currentUserSubject.subscribe(user => {
			if (user === undefined) {
				this.afAuth.signOut().then(value => {

				});
			}
		});
	}

	SignUp(registrationFormValue: RegistrationFormValue) {
		return from(
			this.afAuth.createUserWithEmailAndPassword(registrationFormValue.email!, registrationFormValue.password!)
		).pipe(
			switchMap(res => {
				if (res.user) {
					return res.user.getIdToken();
				}
				console.error('Firebase user is null :( check signup()');
				return of(null);
			}),
			switchMap(token => {
				return this.createUser({
					firstName: registrationFormValue.firstName!,
					lastName: registrationFormValue.lastName!,
					trackEvents: true,
					newsLetter: true,
					token: token!
				});
			}),
			switchMap(() => {
				return this.SendVerificationMail();
			})
		);
	}

	// Reset Forggot password
	sendPasswordReset(passwordResetEmail: string) {
		return from(this.afAuth.sendPasswordResetEmail(passwordResetEmail));
	}

	// Send email verfificaiton when new user sign up
	SendVerificationMail() {
		return this.afAuth.user.pipe(
			tap(u => {
				u?.sendEmailVerification();
			})
		);
	}

	// Sign in with email/password
	SignIn(email: string, password: string) {
		return from(this.afAuth.signInWithEmailAndPassword(email, password));
	}

	getCurrentUser() {
		return this.http.get<User>(environment.apiUrl + '/authentication/me');
	}

	SignInWithAp(request: FirebaseSignInRequest) {
		return this.http.post(environment.apiUrl + '/firebase/sign-in', request, {
			observe: 'response',
		});
	}

	createUser(request: FirebaseSignUpRequest) {
		return this.http.post(environment.apiUrl + '/firebase/users', request, {
			observe: 'response',
		});
	}

	// Sign in with Google
	SignInWithProvider(provider) {
		return this.AuthLogin(provider).pipe(
			catchError((err: HttpErrorResponse) => {
				if (err.status === HttpStatusCode.Forbidden) {
					return this.afAuth.user;
				}
				return of(null);
			}),
			switchMap(usr => {
				if (usr) {
					const firstName = usr.displayName?.split(' ')[0];
					const lastName = usr.displayName?.substring((firstName?.length ?? 0) + 1);
					return forkJoin({
						newsLetter: usr.email ? this.authenticationService.saveNewsLetterSubscriber(usr.email).pipe(
							catchError(err => {
								console.error(err);
								return of(void 0);
							})
						) : of(null),
						firstName: of(firstName ?? '-'),
						lastName: of(lastName ?? '-'),
						token: from(usr.getIdToken()),
					});
				}
				return of(null);
			}),

			switchMap(user => {
				if (user !== null) {
					return this.createUser(
						{
							firstName: user.firstName || '-',
							lastName: user.lastName || '-',
							trackEvents: true,
							newsLetter: true,
							token: user.token!
						}
					);
				}
				return of(null);
			})

		);
	}
	// Auth logic to run auth providers
	private AuthLogin(provider: auth.GoogleAuthProvider) {
		return from(this.afAuth.signInWithPopup(provider)).pipe(
			map(value => {
				return value.user;
			}),
			catchError(err => {
				console.error(err);
				throw err;
			})
		);
	}

}
