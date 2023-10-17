import { Routes } from '@angular/router';
import { FirebaseForgotPasswordComponent } from './forgot-password/firebase-forgot-password.component';
import { FirebaseSignInComponent } from './sign-in/firebase-sign-in.component';
import { FirebaseSignUpComponent } from './sign-up/firebase-sign-up.component';
import { FirebaseAuthContainerComponent } from './auth-container/firebase-auth-container.component';
import { FirebaseAuthActionComponent } from './auth-action/firebase-auth-action.component';

export const FirebaseAuthLayoutRoutes: Routes = [
	{
		path:'',
		component:FirebaseAuthContainerComponent,
		children:[
			{
				title: 'Login - Activepieces',
				path: 'sign-in',
				component: FirebaseSignInComponent,
			},
			{
				title: 'Verify Email - Activepieces',
				path: 'auth-action',
				component: FirebaseAuthActionComponent,
			},
			{
				title: 'Sign Up - Activepieces',
				path: 'sign-up',
				component: FirebaseSignUpComponent,
			},
			{
				title: 'Forgot Password - Activepieces',
				path: 'forgot-password',
				component: FirebaseForgotPasswordComponent,
			}
		]
	}
	
];
