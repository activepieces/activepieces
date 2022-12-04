import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { ForgetPasswordComponent } from './pages/forget-password/forget-password.component';
import { AuthCheckboxComponent } from './pages/check-box/auth-checkbox.component';
import { EmailRegistrationComponent } from './pages/email-registration/email-registration.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CommonLayoutModule } from '../common-layout/common-layout.module';
import { ClosedBetaComponent } from './pages/closed-beta/closed-beta.component';
import { MatTabsModule } from '@angular/material/tabs';
import { OnBoardingFormComponent } from './pages/email-registration/on-boarding-form/on-boarding-form.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthLayoutComponent } from './auth-layout.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(AuthLayoutRoutes),
		FormsModule,
		ReactiveFormsModule,
		CommonLayoutModule,
		MatTabsModule,
		NgSelectModule,
	],
	declarations: [
		AuthLayoutComponent,
		SignInComponent,
		ForgetPasswordComponent,
		AuthCheckboxComponent,
		EmailRegistrationComponent,
		ResetPasswordComponent,
		ClosedBetaComponent,
		OnBoardingFormComponent,
	],
})
export class AuthLayoutModule {}
