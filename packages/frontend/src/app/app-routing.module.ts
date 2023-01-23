import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoggedIn } from './guards/user-logged-in.guard';
import { DashboardContainerComponent } from './modules/dashboard/dashboard-container.component';
import { NotFoundComponent } from './modules/not-found/not-found.component';
import { RedirectUrlComponent } from './modules/redirect-url/redirect-url.component';
import { AuthLayoutComponent } from './modules/auth/auth.component';

const routes: Routes = [
	{
		path: '',
		component: DashboardContainerComponent,
		canActivate: [UserLoggedIn],
		children: [
			{
				path: '',
				loadChildren: () => import('./modules/dashboard/dashboard-layout.module').then(m => m.DashboardLayoutModule),
			},
		],
	},
	{
		path: '',
		children: [
			{
				path: '',
				loadChildren: () => import('./modules/flow-builder/flow-builder.module').then(m => m.FlowBuilderModule),
			},
		],
	},
	{
		path: '',
		component: AuthLayoutComponent,
		children: [
			{
				path: '',
				loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthLayoutModule),
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
		title: 'AP-404',
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
