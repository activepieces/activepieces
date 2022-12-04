import { Routes } from '@angular/router';
import { RunsComponent } from './pages/runs/runs.component';
import { InstancesComponent } from './pages/instances/instances.component';
import { CollectionComponent } from './pages/collections/collection-components.component';
import { ListPiecesResolver } from './resolvers/list-pieces-resolver.service';
import { ListInstancesResolver } from './resolvers/list-instances.resolver';
import { ListInstancesRunResolver } from './resolvers/list-instances-runs.resolver';
import { TrialExpiredGuard } from 'src/app/guards/trial-expired.guard';
import { TrialStatusComponent } from './pages/trial-status/trial-status.component';

export const DashboardLayoutRouting: Routes = [
	{
		path: '',
		canActivate: [TrialExpiredGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: '/flows' },
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
		],
	},
	{ path: 'trial-status', component: TrialStatusComponent },
];
