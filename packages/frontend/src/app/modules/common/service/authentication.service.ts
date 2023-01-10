import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from 'shared';

type FlagsMap = Record<string, boolean | string | Object | undefined>;

@Injectable({
	providedIn: 'root',
})
export class AuthenticationService {
	public currentUserSubject: BehaviorSubject<User | undefined> = new BehaviorSubject<User | undefined>(
		this.currentUser
	);

	private jwtHelper = new JwtHelperService();
	flags$: Observable<FlagsMap>;
	constructor(private router: Router, private http: HttpClient) {}

	get currentUser(): User {
		return JSON.parse(localStorage.getItem(environment.userPropertyNameInLocalStorage) || '{}');
	}

	signIn(request: { email; password }): Observable<HttpResponse<User>> {
		return this.http.post<User>(environment.apiUrl + '/authentication/sign-in', request, {
			observe: 'response',
		});
	}

	signUp(request: { email; password; firstName; lastName; newsLetter; trackEvents }): Observable<HttpResponse<User>> {
		return this.http.post<User>(environment.apiUrl + '/authentication/sign-up', request, {
			observe: 'response',
		});
	}

	saveToken(response: HttpResponse<any>) {
		localStorage.setItem(environment.jwtTokenName, response.body.token);
	}

	saveUser(response: HttpResponse<any>) {
		this.saveToken(response);
		this.updateUser(response.body);
	}

	updateUser(user: User) {
		localStorage.setItem(environment.userPropertyNameInLocalStorage, JSON.stringify(user));
		this.currentUserSubject.next(user);
	}

	isLoggedIn() {
		let jwtToken: any = localStorage.getItem(environment.jwtTokenName);
		if (jwtToken == null) {
			jwtToken = undefined;
		}
		try {
			if (jwtToken && this.jwtHelper.isTokenExpired(jwtToken)) {
				this.logout();
				return false;
			}
		} catch (exception_var) {
			this.logout();
			return false;
		}
		return localStorage.getItem(environment.jwtTokenName) != null;
	}

	logout(): void {
		localStorage.removeItem(environment.jwtTokenName);
		localStorage.removeItem(environment.userPropertyNameInLocalStorage);
		this.currentUserSubject.next(undefined);
		this.router.navigate(['sign-in']);
	}

	isFirstSignIn() {
		return this.getAllFlags().pipe(
			map(value => {
				return !value['USER_CREATED'];
			})
		);
	}

	saveNewsLetterSubscriber(email: string) {
		return this.http.post('https://us-central1-activepieces-b3803.cloudfunctions.net/addContact', { email: email });
	}
	getAllFlags() {
		if (!this.flags$) {
			this.flags$ = this.http.get<FlagsMap>(environment.apiUrl + '/flags').pipe(shareReplay(1));
		}
		return this.flags$;
	}

	getWarningMessage(): Observable<{ title?: string; body?: string } | undefined> {
		return this.getAllFlags().pipe(
			map(flags => {
				const warningTitle: string | undefined = flags['WARNING_TEXT_HEADER'] as string | undefined;
				const warningBody: string | undefined = flags['WARNING_TEXT_BODY'] as string | undefined;
				debugger;
				if (warningTitle || warningBody) {
					return {
						title: warningTitle,
						body: warningBody,
					};
				}
				return undefined;
			})
		);
	}
	getApiUrl(): Observable<string> {
		return this.getAllFlags().pipe(
			map(flags => {
				return flags['API_URL'] as string;
			})
		);
	}

	getServerUrl(): Observable<string> {
		return this.getAllFlags().pipe(
			map(flags => {
				return flags['SERVER_URL'] as string;
			})
		);
	}
}
