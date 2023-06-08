import { Routes } from '@angular/router';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { UserLoggedIn } from '../../guards/user-logged-in.guard';
import { GetInstanceRunResolver } from './resolvers/instance-run.resolver';
import { GetFlowResolver } from './resolvers/flow.resolver';
import { InstanceResolver as GetInstanceResolver } from './resolvers/instance.resolver';
import { ConnectionsResolver } from './resolvers/connections.resolver';
import { BuilderSavingGuard } from '../../guards/builder-saving.guard';

export const FlowLayoutRouting: Routes = [
  {
    path: 'flows/:id',
    component: CollectionBuilderComponent,
    resolve: {
      flowAndFolder: GetFlowResolver,
      instanceData: GetInstanceResolver,
      connections: ConnectionsResolver,
    },
    canActivate: [UserLoggedIn],
    canDeactivate: [BuilderSavingGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'runs/:runId',
    component: CollectionBuilderComponent,
    resolve: {
      runInformation: GetInstanceRunResolver,
      connections: ConnectionsResolver,
    },
    canActivate: [UserLoggedIn],
  },
];
