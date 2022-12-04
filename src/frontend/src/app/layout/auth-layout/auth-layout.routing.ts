import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { ForgetPasswordComponent } from './pages/forget-password/forget-password.component';
import { EmailRegistrationComponent } from './pages/email-registration/email-registration.component';
import { UserNotLoggedIn } from '../../guards/user-not-logged-in.guard';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

export const AuthLayoutRoutes: Routes = [
	{
		path: 'sign-in',
		component: SignInComponent,
		canActivate: [UserNotLoggedIn],
	},
	{
		path: 'forgot-password',
		component: ForgetPasswordComponent,
		canActivate: [UserNotLoggedIn],
	},
	{
		path: 'sign-up/:token',
		component: EmailRegistrationComponent,
	},
	{
		path: 'change-password/:token',
		component: ResetPasswordComponent,
	},
	{
		path: 'sign-up',
		component: SignUpComponent,
	},
	{
		path: 'hidden-sign-up',
		component: SignUpComponent,
	},
];
