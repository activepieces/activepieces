import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');
  const projectParam = params.get('project');
  const group = toGroup(params.get('group') ?? legacyGroup(tab));

  const toolsParams = ({
    projectId,
    group,
  }: {
    projectId: string | null;
    group: McpToolGroup;
  }) => ({
    ...(projectId === null ? {} : { project: projectId }),
    ...(group === DEFAULT_GROUP ? {} : { group }),
  });

  return {
    clientKey,
    group,
    tab: toTab(tab),
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    projectId: projectParam ?? authenticationSession.getProjectId(),
    legacyRedirect: isLegacyPiecesTab(tab)
      ? `/mcp-server/tools?${new URLSearchParams(
          toolsParams({ projectId: projectParam, group: 'pieces' }),
        ).toString()}`
      : null,
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
    showTab: (value: string) => navigate(`/mcp-server/${toTab(value)}`),
    showGroup: (value: string) =>
      setParams(
        toolsParams({ projectId: projectParam, group: toGroup(value) }),
      ),
    selectProject: (projectId: string) =>
      setParams(toolsParams({ projectId, group })),
  };
}

function toTab(value: string | undefined): McpTab {
  if (isLegacyPiecesTab(value)) {
    return 'tools';
  }
  return value === 'connections' || value === 'tools' || value === 'activity'
    ? value
    : 'connect';
}

function toGroup(value: string | undefined | null): McpToolGroup {
  return value === 'pieces' ? value : DEFAULT_GROUP;
}

function isLegacyPiecesTab(value: string | undefined): boolean {
  return value === LEGACY_PIECES_TAB;
}

function legacyGroup(tab: string | undefined): McpToolGroup | undefined {
  return isLegacyPiecesTab(tab) ? 'pieces' : undefined;
}

const LEGACY_PIECES_TAB = 'pieces';
const DEFAULT_GROUP: McpToolGroup = 'built-in';

export type McpTab = 'connect' | 'tools' | 'connections' | 'activity';

export type McpToolGroup = 'built-in' | 'pieces';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  group: McpToolGroup;
  view: McpView;
  clientKey: string | null;
  projectId: string | null;
  legacyRedirect: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showTab: (value: string) => void;
  showGroup: (value: string) => void;
  selectProject: (projectId: string) => void;
};
