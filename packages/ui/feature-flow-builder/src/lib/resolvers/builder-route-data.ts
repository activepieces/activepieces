import { ConnectionsResolverData } from '@activepieces/ui/common';
import { FlowResolverData } from './flow.resolver';
import { InstanceRunResolverData } from './instance-run.resolver';
export type BuilderRouteData = {
  flowAndFolder: FlowResolverData;
  connections: ConnectionsResolverData;
  runInformation: undefined;
};

export type RunRouteData = {
  runInformation: InstanceRunResolverData;
  connections: ConnectionsResolverData;
};
