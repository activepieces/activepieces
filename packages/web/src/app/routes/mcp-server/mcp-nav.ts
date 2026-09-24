import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');
  const projectParam = params.get('project');
  const segment = toSegment(params.get('segment') ?? legacySegment(tab));

  const buildToolsParams = ({
    projectId,
    segment,
  }: {
    projectId: string | null;
    segment: McpToolSegment;
  }) => ({
    ...(projectId === null ? {} : { project: projectId }),
    ...(segment === DEFAULT_SEGMENT ? {} : { segment }),
  });

  return {
    clientKey,
    segment,
    tab: toTab(tab),
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    projectId: projectParam ?? authenticationSession.getProjectId(),
    legacyRedirect: isLegacyPiecesTab(tab)
      ? `/mcp-server/tools?${new URLSearchParams(
          buildToolsParams({ projectId: projectParam, segment: 'pieces' }),
        ).toString()}`
      : null,
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
    showTab: (value: string) => navigate(`/mcp-server/${toTab(value)}`),
    selectSegment: (value: string) =>
      setParams(
        buildToolsParams({
          projectId: projectParam,
          segment: toSegment(value),
        }),
      ),
    selectProject: (projectId: string) =>
      setParams(buildToolsParams({ projectId, segment })),
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

function toSegment(value: string | undefined | null): McpToolSegment {
  return value === 'pieces' ? value : DEFAULT_SEGMENT;
}

function isLegacyPiecesTab(value: string | undefined): boolean {
  return value === LEGACY_PIECES_TAB;
}

function legacySegment(tab: string | undefined): McpToolSegment | undefined {
  return isLegacyPiecesTab(tab) ? 'pieces' : undefined;
}

const LEGACY_PIECES_TAB = 'pieces';
const DEFAULT_SEGMENT: McpToolSegment = 'built-in';

export type McpTab = 'connect' | 'tools' | 'connections' | 'activity';

export type McpToolSegment = 'built-in' | 'pieces';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  segment: McpToolSegment;
  view: McpView;
  clientKey: string | null;
  projectId: string | null;
  legacyRedirect: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showTab: (value: string) => void;
  selectSegment: (value: string) => void;
  selectProject: (projectId: string) => void;
};
