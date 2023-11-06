import { Routes } from '@angular/router';
import { FirebaseForgotPasswordComponent } from './forgot-password/firebase-forgot-password.component';
import { FirebaseSignInComponent } from './sign-in/firebase-sign-in.component';
import { FirebaseSignUpComponent } from './sign-up/firebase-sign-up.component';
import { FirebaseAuthContainerComponent } from './auth-container/firebase-auth-container.component';
import { FirebaseAuthActionComponent } from './auth-action/firebase-auth-action.component';

export const FirebaseAuthLayoutRoutes: Routes = [
	{
		path: '',
		component: FirebaseAuthContainerComponent,
		children: [
			{
				data: {
					title: 'Login'
				},
				path: 'sign-in',
				component: FirebaseSignInComponent,
			},
			{
				data: {
					title: 'Verify Email'
				},
				path: 'auth-action',
				component: FirebaseAuthActionComponent,
			},
			{
				data: {
					title: 'Sign Up'
				},
				path: 'sign-up',
				component: FirebaseSignUpComponent,
			},
			{
				data: {
					title: 'Forgot Password'
				},
				path: 'forgot-password',
				component: FirebaseForgotPasswordComponent,
			}
		]
	}

];
