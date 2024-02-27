import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  AuthenticationResponse,
  ClaimTokenRequest,
  FederatedAuthnLoginResponse,
  Principal,
  SignInRequest,
  SignUpRequest,
  ThirdPartyAuthnProviderEnum,
  User,
} from '@activepieces/shared';
import { environment } from '../environments/environment';
import {
  CreateOtpRequestBody,
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
} from '@activepieces/ee-shared';
import { FlagService } from './flag.service';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<
    AuthenticationResponse | undefined
  > = new BehaviorSubject<AuthenticationResponse | undefined>(this.currentUser);
  private jwtHelper = new JwtHelperService();
  constructor(
    private router: Router,
    private http: HttpClient,
    private flagsService: FlagService
  ) {}

  get currentUser(): AuthenticationResponse {
    return JSON.parse(
      localStorage.getItem(environment.userPropertyNameInLocalStorage) || '{}'
    );
  }

  me(): Observable<UserWithoutPassword> {
    return this.http.get<UserWithoutPassword>(environment.apiUrl + '/users/me');
  }

  signIn(
    request: SignInRequest
  ): Observable<HttpResponse<AuthenticationResponse>> {
    return this.http.post<AuthenticationResponse>(
      environment.apiUrl + '/authentication/sign-in',
      request,
      {
        observe: 'response',
      }
    );
  }

  signUp(
    request: SignUpRequest
  ): Observable<HttpResponse<AuthenticationResponse>> {
    return this.http.post<AuthenticationResponse>(
      environment.apiUrl + '/authentication/sign-up',
      request,
      {
        observe: 'response',
      }
    );
  }

  saveToken(token: string) {
    localStorage.setItem(environment.jwtTokenName, token);
  }

  saveUser(user: AuthenticationResponse, token: string) {
    this.saveToken(token);
    this.updateUser(user);
  }

  updateUser(user: AuthenticationResponse) {
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
    this.flagsService.reinitialiseFlags();
    this.router.navigate(['sign-in']);
  }

  getToken(): string | null {
    return localStorage.getItem(environment.jwtTokenName);
  }

  getDecodedToken(): Principal | null {
    const token = localStorage.getItem(environment.jwtTokenName);
    const decodedToken = this.jwtHelper.decodeToken(token || '');
    return decodedToken;
  }

  getProjectId(): string {
    const decodedToken = this.getDecodedToken();
    const projectId = decodedToken?.['projectId'];
    if (!projectId) {
      throw new Error('ProjectId not found in token');
    }
    return projectId;
  }

  getPlatformId(): string | undefined {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.platform?.id;
  }

  isPlatformOwner(): boolean {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.platform?.role === 'OWNER';
  }

  sendOtpEmail(req: CreateOtpRequestBody) {
    return this.http.post<void>(`${environment.apiUrl}/otp`, req);
  }

  verifyEmail(req: VerifyEmailRequestBody) {
    return this.http.post<void>(
      `${environment.apiUrl}/authn/local/verify-email`,
      req
    );
  }
  resetPassword(req: ResetPasswordRequestBody) {
    return this.http.post<void>(
      `${environment.apiUrl}/authn/local/reset-password`,
      req
    );
  }

  getThirdPartyLoginUrl(provider: ThirdPartyAuthnProviderEnum) {
    return this.http.get<FederatedAuthnLoginResponse>(
      `${environment.apiUrl}/authn/federated/login`,
      {
        params: {
          providerName: provider,
        },
      }
    );
  }

  claimThirdPartyRequest(request: ClaimTokenRequest) {
    return this.http.post<AuthenticationResponse>(
      `${environment.apiUrl}/authn/federated/claim`,
      request,
      {
        observe: 'response',
      }
    );
  }
}
