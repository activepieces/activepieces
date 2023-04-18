import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SignInRequest, SignUpRequest, User } from '@activepieces/shared';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<User | undefined> =
    new BehaviorSubject<User | undefined>(this.currentUser);
  public openFeedbackPopover$: Subject<void> = new Subject();
  private jwtHelper = new JwtHelperService();
  constructor(private router: Router, private http: HttpClient) {}

  get currentUser(): User {
    return JSON.parse(
      localStorage.getItem(environment.userPropertyNameInLocalStorage) || '{}'
    );
  }

  signIn(request: SignInRequest): Observable<HttpResponse<User>> {
    return this.http.post<User>(
      environment.apiUrl + '/authentication/sign-in',
      request,
      {
        observe: 'response',
      }
    );
  }

  signUp(request: SignUpRequest): Observable<HttpResponse<User>> {
    return this.http.post<User>(
      environment.apiUrl + '/authentication/sign-up',
      request,
      {
        observe: 'response',
      }
    );
  }

  saveToken(response: HttpResponse<any>) {
    localStorage.setItem(environment.jwtTokenName, response.body.token);
  }

  saveUser(response: HttpResponse<any>) {
    this.saveToken(response);
    this.updateUser(response.body);
  }

  updateUser(user: User) {
    localStorage.setItem(
      environment.userPropertyNameInLocalStorage,
      JSON.stringify(user)
    );
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

  // TODO - move to a separate service
  saveNewsLetterSubscriber(email: string) {
    return this.http.post(
      'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
      { email: email }
    );
  }

  // TODO - move to a separate service
  sendFeedback(feedback: string) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks?flowId=uKCHMo6jwgMfzvSHb6CKQ',
      { email: this.currentUser.email, feedback: feedback }
    );
  }
}
