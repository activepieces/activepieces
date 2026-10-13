import { Permission } from '@activepieces/core-utils';

import { authenticationSession } from './authentication-session';

export const routesThatRequireProjectId = {
  runs: '/runs',
  singleRun: '/runs/:runId',
  flows: '/flows',
  singleFlow: '/flows/:flowId',
  automations: '/automations',
  connections: '/integrations',
  singleConnection: '/integrations/:connectionId',
  variables: '/variables',
  singleAgent: '/agents/:agentId',
  singleAgentRuns: '/agents/:agentId/runs',
  tables: '/tables',
  singleTable: '/tables/:tableId',
  settings: '/settings',
  releases: '/releases',
  singleRelease: '/releases/:releaseId',
  approvals: '/approvals',
};

export const CHAT_ROUTE = '/chat';

export const DASHBOARD_ROUTE = '/dashboard';

export const determineDefaultRoute = ({
  checkAccess,
  chatEnabled,
}: {
  checkAccess: (permission: Permission) => boolean;
  chatEnabled?: boolean;
}) => {
  // Synkra: always land on the dashboard home.
  // The dashboard shows snapshots of usage, runs, integrations, and
  // provides quick actions. It requires a project context because it
  // lives inside ProjectDashboardLayout.
  if (authenticationSession.getProjectId()) {
    return DASHBOARD_ROUTE;
  }
  // Fallback for users without a project yet.
  if (chatEnabled) {
    return CHAT_ROUTE;
  }
  if (checkAccess(Permission.READ_FLOW) || checkAccess(Permission.READ_TABLE)) {
    return authenticationSession.appendProjectRoutePrefix('/automations');
  }
  if (checkAccess(Permission.READ_RUN)) {
    return authenticationSession.appendProjectRoutePrefix('/runs');
  }
  return authenticationSession.appendProjectRoutePrefix('/settings');
};

export const TRIAL_KEY_QUERY_PARAM = 'licenseKey';
export const NEW_FLOW_QUERY_PARAM = 'newFlow';
export const NEW_TABLE_QUERY_PARAM = 'newTable';
