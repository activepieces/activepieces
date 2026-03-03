import { Permission } from '@activepieces/shared';

import { authenticationSession } from './authentication-session';

export const routesThatRequireProjectId = {
  runs: '/runs',
  singleRun: '/runs/:runId',
  flows: '/flows',
  singleFlow: '/flows/:flowId',
  connections: '/connections',
  singleConnection: '/connections/:connectionId',
  tables: '/tables',
  singleTable: '/tables/:tableId',
  settings: '/settings',
  releases: '/releases',
  singleRelease: '/releases/:releaseId',
};

export const determineDefaultRoute = (
  checkAccess: (permission: Permission) => boolean,
) => {
  if (checkAccess(Permission.READ_FLOW)) {
    return authenticationSession.appendProjectRoutePrefix('/flows');
  }
  if (checkAccess(Permission.READ_RUN)) {
    return authenticationSession.appendProjectRoutePrefix('/runs');
  }
  return authenticationSession.appendProjectRoutePrefix('/settings');
};

export const NEW_FLOW_QUERY_PARAM = 'newFlow';
export const NEW_TABLE_QUERY_PARAM = 'newTable';
