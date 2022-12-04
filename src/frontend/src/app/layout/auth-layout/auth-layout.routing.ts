import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { UserNotLoggedIn } from '../../guards/user-not-logged-in.guard';

export const AuthLayoutRoutes: Routes = [
	{
		path: 'sign-in',
		component: SignInComponent,
		canActivate: [UserNotLoggedIn],
	},
];
