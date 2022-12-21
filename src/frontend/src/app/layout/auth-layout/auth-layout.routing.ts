import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { UserNotLoggedIn } from '../../guards/user-not-logged-in.guard';
import { SignUpComponent } from './pages/sign-up/sign-up.component';

export const AuthLayoutRoutes: Routes = [
	{
		path: 'sign-in',
		component: SignInComponent,
		canActivate: [UserNotLoggedIn],
	},
	{
		path: 'sign-up',
		component: SignUpComponent,
	},
];
