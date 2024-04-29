import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { AuthLayoutComponent } from './auth.component';
import {
  UiCommonModule,
  showBasedOnEditionGuard,
} from '@activepieces/ui/common';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { IsFirstSignInResolver } from './resolvers/is-first-sign-in.resolver';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthenticationComponent } from './pages/authenticate/authenticate.component';
import { SendEmailForAuthActionComponent } from './components/send-email-for-auth-action/send-email-for-auth-action.component';
import { ApEdition } from '@activepieces/shared';
import { VerifyEmailPostSignUpComponent } from './pages/auth-actions/verify-email-post-sign-up/verify-email-post-sign-up.component';
import { ResetPasswordComponent } from './pages/auth-actions/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { EeComponentsModule } from 'ee-components';
import { RedirectToDashboardIfLoggedInGuard } from './guards/redirect-to-dashboard-if-logged-in.guard';
import { AuthenticationMethodsSeparatorComponent } from './components/authentication-methods-separator/authentication-methods-separator.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatMenuModule,
    MatCardModule,
    AngularSvgIconModule,
    EeComponentsModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', redirectTo: '/sign-in' },
      {
        path: 'authenticate',
        component: AuthenticationComponent,
      },
      {
        path: '',
        component: AuthLayoutComponent,
        children: [
          {
            path: 'sign-in',
            component: SignInComponent,
            resolve: { firstSignIn: IsFirstSignInResolver },
            data: {
              title: $localize`Sign in`,
            },
            canActivate: [RedirectToDashboardIfLoggedInGuard],
          },
          {
            path: 'sign-up',
            component: SignUpComponent,
            data: {
              title: $localize`Sign up`,
            },
            canActivate: [RedirectToDashboardIfLoggedInGuard],
          },
          {
            path: 'verify-email',
            component: VerifyEmailPostSignUpComponent,
            data: {
              title: $localize`Verify email`,
            },
            canActivate: [
              showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
            ],
          },
          {
            path: 'reset-password',
            component: ResetPasswordComponent,
            data: {
              title: $localize`Reset password`,
            },
            canActivate: [
              showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
            ],
          },
          {
            path: 'forgot-password',
            component: ForgotPasswordComponent,
            data: {
              title: $localize`Forgot password`,
            },
            canActivate: [
              showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
              RedirectToDashboardIfLoggedInGuard,
            ],
          },
        ],
      },
    ]),
  ],
  declarations: [
    AuthLayoutComponent,
    SignInComponent,
    SignUpComponent,
    AuthenticationComponent,
    SendEmailForAuthActionComponent,
    VerifyEmailPostSignUpComponent,
    ResetPasswordComponent,
    ForgotPasswordComponent,
    AuthenticationMethodsSeparatorComponent,
  ],
})
export class UiFeatureAuthenticationModule {}
