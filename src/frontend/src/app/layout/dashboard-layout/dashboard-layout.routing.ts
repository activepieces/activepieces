import { Routes } from '@angular/router';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { RunsComponent } from './pages/runs/runs.component';
import { InstancesComponent } from './pages/instances/instances.component';
import { EnvironmentsComponent } from './pages/environments/environments.component';
import { EventsComponent } from './pages/events/events.component';
import { CollectionComponent } from './pages/collections/collection-components.component';
import { ListPiecesResolver } from './resolvers/list-pieces-resolver.service';
import { ApiKeysComponent } from './pages/api-keys/api-keys.component';
import { ListInstancesResolver } from './resolvers/list-instances.resolver';
import { ListInstancesRunResolver } from './resolvers/list-instances-runs.resolver';
import { ListAccountsResolver } from './resolvers/list-accounts.resolver';
import { TrialExpiredGuard } from 'src/app/guards/trial-expired.guard';
import { TrialStatusComponent } from './pages/trial-status/trial-status.component';
import { AuthenticationComponent } from './pages/authentication/authentication.component';
import { AuthenticationResolver } from './resolvers/authentication.resolver';

export const DashboardLayoutRouting: Routes = [
	{
		path: '',
		canActivate: [TrialExpiredGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: '/flows' },
			{
				path: 'accounts',
				pathMatch: 'full',
				component: AccountsComponent,
				resolve: { accounts: ListAccountsResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange',
			},
			{
				path: 'environments',
				pathMatch: 'full',
				component: EnvironmentsComponent,
				resolve: {},
			},
			{
				path: 'events',
				pathMatch: 'full',
				component: EventsComponent,
				resolve: {},
			},
			{
				path: 'api-keys',
				pathMatch: 'full',
				component: ApiKeysComponent,
				resolve: {},
			},
			{
				path: 'runs',
				pathMatch: 'full',
				component: RunsComponent,
				resolve: { runs: ListInstancesRunResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange',
			},
			{
				path: 'instances',
				pathMatch: 'full',
				component: InstancesComponent,
				resolve: { instances: ListInstancesResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange',
			},
			{
				path: 'flows',
				pathMatch: 'full',
				component: CollectionComponent,
				resolve: {
					collections: ListPiecesResolver,
				},
			},
			{
				path: 'authentication',
				pathMatch: 'full',
				component: AuthenticationComponent,
				resolve: {
					authentications: AuthenticationResolver,
				},
			},
		],
	},
	{ path: 'trial-status', component: TrialStatusComponent },
];
