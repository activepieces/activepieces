import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

const PROJECT_SCOPED_TABS: McpTab[] = ['pieces', 'tools'];

function toTab(value: string | undefined): McpTab {
  return value === 'connections' ||
    value === 'pieces' ||
    value === 'tools' ||
    value === 'activity'
    ? value
    : 'connect';
}

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');
  const projectParam = params.get('project');
  const currentTab = toTab(tab);

  return {
    clientKey,
    tab: currentTab,
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    projectId: projectParam ?? authenticationSession.getProjectId(),
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
    showTab: (value: string) => {
      const nextTab = toTab(value);
      const keepsProject =
        PROJECT_SCOPED_TABS.includes(currentTab) &&
        PROJECT_SCOPED_TABS.includes(nextTab) &&
        projectParam !== null;
      navigate(
        keepsProject
          ? `/mcp-server/${nextTab}?project=${projectParam}`
          : `/mcp-server/${nextTab}`,
      );
    },
    selectProject: (projectId: string) => setParams({ project: projectId }),
  };
}

export type McpTab =
  | 'connect'
  | 'pieces'
  | 'tools'
  | 'connections'
  | 'activity';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  view: McpView;
  clientKey: string | null;
  projectId: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showTab: (value: string) => void;
  selectProject: (projectId: string) => void;
};
