import { Routes } from '@angular/router';
import { FirebaseForgotPasswordComponent } from './forgot-password/firebase-forgot-password.component';
import { FirebaseSignInComponent } from './sign-in/firebase-sign-in.component';
import { FirebaseSignUpComponent } from './sign-up/firebase-sign-up.component';

export const FirebaseAuthLayoutRoutes: Routes = [
	{
		title: 'AP-Sign In',
		path: 'sign-in',
		component: FirebaseSignInComponent,
	},
	{
		title: 'AP-Sign Up',
		path: 'sign-up',
		component: FirebaseSignUpComponent,
	},
	{
		title: 'AP-Forgot Password',
		path: 'forgot-password',
		component: FirebaseForgotPasswordComponent,
	}
];
