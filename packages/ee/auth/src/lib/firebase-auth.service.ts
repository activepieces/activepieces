import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';
import {
  FirebaseSignUpRequest,
  FirebaseSignInRequest
} from '@activepieces/ee-shared';
import { User } from '@activepieces/shared';
import { AuthenticationService } from '@activepieces/ui/common';
import { environment } from '@activepieces/ui/common';
import { GithubAuthProvider, GoogleAuthProvider } from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';

export type RegistrationFormValue = {
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  password?: string;
};

const REFERRING_STORE_NAME = 'referringUserId';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  constructor(
    private http: HttpClient,
    public afAuth: AngularFireAuth,
    public router: Router,
    private authenticationService: AuthenticationService
  ) {}

  saveReferringUserId(referringUserId: string) {
    localStorage.setItem(REFERRING_STORE_NAME, referringUserId);
  }

  signUp(
    registrationFormValue: RegistrationFormValue,
    redirectUrl: string
  ): Observable<any> {
    return from(
      this.afAuth.createUserWithEmailAndPassword(
        registrationFormValue.email!,
        registrationFormValue.password!
      )
    ).pipe(
      switchMap((res) => {
        if (res.user) {
          return from(res.user.getIdToken());
        }
        console.error('Firebase user is null :( check signUp()');
        return of(null);
      }),
      switchMap((token: string | null) => {
        return this.createUser({
          firstName: registrationFormValue.firstName!,
          lastName: registrationFormValue.lastName!,
          trackEvents: true,
          newsLetter: true,
          token: token!
        });
      }),
      switchMap(() => {
        return this.sendVerificationMail(redirectUrl);
      })
    );
  }
  // Reset Forggot password
  sendPasswordReset(
    passwordResetEmail: string,
    redirectUrl: string | undefined
  ) {
    return from(
      this.afAuth.sendPasswordResetEmail(
        passwordResetEmail,
        redirectUrl
          ? {
              url: redirectUrl
            }
          : undefined
      )
    );
  }

  // Send email verfificaiton when new user sign up
  sendVerificationMail(redirectUrl: string): Observable<any> {
    return this.afAuth.user.pipe(
      take(1),
      tap((u) => {
        if (u && u.emailVerified === false) {
          console.log("sending verfication email...");
          u.sendEmailVerification(
            redirectUrl
              ? {
                  url: redirectUrl
                }
              : undefined
          );
        }
      })
    );
  }

  // Sign in with email/password
  signIn(email: string, password: string): Observable<firebase.default.auth.UserCredential>{
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }

  getCurrentUser() {
    return this.http.get<User>(environment.apiUrl + '/authentication/me');
  }

  signInWithAp(request: FirebaseSignInRequest) {
    return this.http.post(environment.apiUrl + '/firebase/sign-in', request, {
      observe: 'response'
    });
  }

  createUser(request: FirebaseSignUpRequest) {
    return this.http
      .post(
        environment.apiUrl + '/firebase/users',
        {
          ...request,
          referringUserId:
            localStorage.getItem(REFERRING_STORE_NAME) ?? undefined
        },
        {
          observe: 'response'
        }
      )
      .pipe(
        tap((response) => {
          if (response.status >= 200 && response.status < 300) {
            localStorage.removeItem(REFERRING_STORE_NAME);
          }
        })
      );
  }

  verifyEmail(oobCode: string) {
    return from(this.afAuth.applyActionCode(oobCode));
  }

  // Sign in with Google
  SignInWithProvider(provider: GoogleAuthProvider | GithubAuthProvider) {
    return this.AuthLogin(provider).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.Forbidden) {
          return this.afAuth.user;
        }
        return of(null);
      }),
      switchMap((usr) => {
        if (usr) {
          const firstName = usr.displayName?.split(' ')[0];
          const lastName = usr.displayName?.substring(
            (firstName?.length ?? 0) + 1
          );
          return forkJoin({
            newsLetter: usr.email
              ? this.authenticationService
                  .saveNewsLetterSubscriber(usr.email)
                  .pipe(
                    catchError((err) => {
                      console.error(err);
                      return of(void 0);
                    })
                  )
              : of(null),
            firstName: of(firstName ?? '-'),
            lastName: of(lastName ?? '-'),
            token: from(usr.getIdToken())
          });
        }
        return of(null);
      }),

      switchMap((user) => {
        if (user !== null) {
          return this.createUser({
            firstName: user.firstName || '-',
            lastName: user.lastName || '-',
            trackEvents: true,
            newsLetter: true,
            token: user.token!
          });
        }
        return of(null);
      })
    );
  }
  // Auth logic to run auth providers
  private AuthLogin(provider: GoogleAuthProvider) {
    return from(this.afAuth.signInWithPopup(provider)).pipe(
      map((value) => {
        return value.user;
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      })
    );
  }
}
