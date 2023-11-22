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
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { AuthenticationComponent } from './pages/authenticate/authenticate.component';
import { EmailVerificationComponent } from './pages/email-verification/email-verification.component';
import { AuthActionComponent } from './pages/auth-action/auth-action.component';
import { ApEdition } from '@activepieces/shared';

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
    RouterModule.forChild([
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
          },
          {
            path: 'sign-up',
            component: SignUpComponent,
            data: {
              title: $localize`Sign up`,
            },
          },
          {
            path: 'auth-action',
            component: AuthActionComponent,
            data: {
              title: $localize`Verify email`,
            },
            canActivate: [showBasedOnEditionGuard([ApEdition.ENTERPRISE])],
          },
        ],
      },
    ]),
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  declarations: [
    AuthLayoutComponent,
    SignInComponent,
    SignUpComponent,
    AuthenticationComponent,
    EmailVerificationComponent,
    AuthActionComponent,
  ],
})
export class UiFeatureAuthenticationModule {}
