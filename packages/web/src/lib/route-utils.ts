import { Permission } from '@activepieces/core-utils';

import { authenticationSession } from './authentication-session';

export const routesThatRequireProjectId = {
  runs: '/runs',
  singleRun: '/runs/:runId',
  flows: '/flows',
  singleFlow: '/flows/:flowId',
  automations: '/automations',
  connections: '/connections',
  singleConnection: '/connections/:connectionId',
  variables: '/variables',
  tables: '/tables',
  singleTable: '/tables/:tableId',
  settings: '/settings',
  releases: '/releases',
  singleRelease: '/releases/:releaseId',
};

export const CHAT_ROUTE = '/chat';

export const determineDefaultRoute = ({
  checkAccess,
}: {
  checkAccess: (permission: Permission) => boolean;
}) => {
  if (checkAccess(Permission.READ_FLOW) || checkAccess(Permission.READ_TABLE)) {
    return authenticationSession.appendProjectRoutePrefix('/automations');
  }
  if (checkAccess(Permission.READ_RUN)) {
    return authenticationSession.appendProjectRoutePrefix('/runs');
  }
  return authenticationSession.appendProjectRoutePrefix('/settings');
};

// The landing surface for a logged-in, onboarded operator user. Chat is the landing
// ONLY when the user actually has it: a project is selected, it is not an embed, and
// the plan resolves chat on (Community, EE-without-flag, and Cloud-outside-rollout all
// resolve chatEnabled=false and fall through to the classic default — never /chat).
export const resolveAuthenticatedLanding = ({
  projectId,
  isEmbedded,
  chatEnabled,
  classicRoute,
}: {
  projectId: string | null;
  isEmbedded: boolean;
  chatEnabled: boolean;
  classicRoute: string;
}): string => {
  const canUseChat = !!projectId && !isEmbedded && chatEnabled;
  return canUseChat ? CHAT_ROUTE : classicRoute;
};

export const NEW_FLOW_QUERY_PARAM = 'newFlow';
export const NEW_TABLE_QUERY_PARAM = 'newTable';
