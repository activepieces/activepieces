import { Routes } from '@angular/router';
import { FlowBuilderComponent } from './page/flow-builder/flow-builder.component';
import { GetInstanceRunResolver } from './resolvers/instance-run.resolver';
import { GetFlowResolver } from './resolvers/flow.resolver';
import { ConnectionsResolver, UserLoggedIn } from '@activepieces/ui/common';
import { BuilderSavingGuard } from './guards/builder-saving.guard';

export const FlowLayoutRouting: Routes = [
  {
    path: 'flows/:id',
    component: FlowBuilderComponent,
    resolve: {
      flowAndFolder: GetFlowResolver,
      connections: ConnectionsResolver,
    },
    canActivate: [UserLoggedIn],
    canDeactivate: [BuilderSavingGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'runs/:runId',
    component: FlowBuilderComponent,
    resolve: {
      runInformation: GetInstanceRunResolver,
      connections: ConnectionsResolver,
    },
    canActivate: [UserLoggedIn],
  },
];
