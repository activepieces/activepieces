import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

function toTab(value: string | undefined): McpTab {
  return value === 'connections' || value === 'reach' ? value : 'connect';
}

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');

  return {
    clientKey,
    tab: toTab(tab),
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    projectId: params.get('project') ?? authenticationSession.getProjectId(),
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
    showReach: () => navigate('/mcp-server/reach'),
    showConnections: () => navigate('/mcp-server/connections'),
    showConnect: () => navigate('/mcp-server/connect'),
    selectProject: (projectId: string) => setParams({ project: projectId }),
  };
}

export const MCP_TABS: McpTab[] = ['connect', 'reach', 'connections'];

export type McpTab = 'connect' | 'reach' | 'connections';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  view: McpView;
  clientKey: string | null;
  projectId: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showReach: () => void;
  showConnections: () => void;
  showConnect: () => void;
  selectProject: (projectId: string) => void;
};
