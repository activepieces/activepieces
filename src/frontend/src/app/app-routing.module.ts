import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoggedIn } from './guards/user-logged-in.guard';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { NotFoundComponent } from './layout/not-found/not-found.component';
import { RedirectUrlComponent } from './layout/redirect-url/redirect-url.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { ChangeLogComponent } from './layout/change-log-layout/change-log/change-log.component';

const routes: Routes = [
	{
		path: '',
		component: DashboardLayoutComponent,
		canActivate: [UserLoggedIn],
		children: [
			{
				path: '',
				loadChildren: () =>
					import('./layout/dashboard-layout/dashboard-layout.module').then(m => m.DashboardLayoutModule),
			},
		],
	},
	{
		path: '',
		children: [
			{
				path: '',
				loadChildren: () => import('./layout/flow-builder/flow-layout.module').then(m => m.FlowLayoutModule),
			},
		],
	},
	{
		path: '',
		component: AuthLayoutComponent,
		children: [
			{
				path: '',
				loadChildren: () => import('./layout/auth-layout/auth-layout.module').then(m => m.AuthLayoutModule),
			},
		],
	},
	{
		path: '',
		component: ChangeLogComponent,
		children: [
			{
				path: '',
				loadChildren: () =>
					import('./layout/change-log-layout/change-log-layout.module').then(m => m.ChangeLogLayoutModule),
			},
		],
	},
	{
		path: 'redirect',
		component: RedirectUrlComponent,
	},
	{
		path: '**',
		component: NotFoundComponent,
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			urlUpdateStrategy: 'eager',
		}),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {}
