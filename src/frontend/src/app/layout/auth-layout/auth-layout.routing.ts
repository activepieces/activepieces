import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { UserNotLoggedIn } from '../../guards/user-not-logged-in.guard';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { FirstSignIn } from 'src/app/guards/first-sign-in-guard';
import { IsNotFirstSignIn } from 'src/app/guards/is-not-first-sign-in-guard copy';

export const AuthLayoutRoutes: Routes = [
	{
		path: 'sign-in',
		component: SignInComponent,
		canActivate: [UserNotLoggedIn, IsNotFirstSignIn],
	},
	{
		path: 'sign-up',
		component: SignUpComponent,
		canActivate: [FirstSignIn],
	},
];
