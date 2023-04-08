import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { AuthLayoutComponent } from './auth.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { IsFirstSignInResolver } from './resolvers/is-first-sign-in.resolver';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';

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
        title: 'AP-Sign In',
        path: 'sign-in',
        component: SignInComponent,
        resolve: { firstSignIn: IsFirstSignInResolver },
      },
      {
        title: 'AP-Sign Up',
        path: 'sign-up',
        component: SignUpComponent,
      },
    ]),
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  declarations: [AuthLayoutComponent, SignInComponent, SignUpComponent],
})
export class UiFeatureAuthenticationModule {}
