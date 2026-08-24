import { useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

function readTab(params: URLSearchParams): McpTab {
  const tab = params.get('tab');
  if (tab === 'connections' || tab === 'reach') {
    return tab;
  }
  return 'connect';
}

export function useMcpNav(): McpNav {
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');

  const keepProject = (next: Record<string, string>) => {
    const project = params.get('project');
    return project === null ? next : { ...next, project };
  };

  return {
    clientKey,
    tab: readTab(params),
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    projectId: params.get('project') ?? authenticationSession.getProjectId()!,
    showLanding: () => setParams(keepProject({})),
    showBrowse: () => setParams(keepProject({ browse: '1' })),
    showClient: (key: string) => setParams(keepProject({ client: key })),
    showReach: () => setParams(keepProject({ tab: 'reach' })),
    showConnections: () => setParams(keepProject({ tab: 'connections' })),
    selectProject: (projectId: string) =>
      setParams({ tab: readTab(params), project: projectId }),
  };
}

export type McpTab = 'connect' | 'reach' | 'connections';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  view: McpView;
  clientKey: string | null;
  projectId: string;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showReach: () => void;
  showConnections: () => void;
  selectProject: (projectId: string) => void;
};
