import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { IsFirstSignInResolver } from './resolvers/is-first-sign-in.resolver';

export const AuthLayoutRoutes: Routes = [
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
];
