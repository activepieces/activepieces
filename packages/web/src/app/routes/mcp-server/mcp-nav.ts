import { ApId } from '@activepieces/core-utils';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');
  const projectParam = toProjectId(params.get('project'));
  const segment = toSegment(params.get('segment'));

  return {
    clientKey,
    segment,
    tab: toTab(tab),
    projectId: projectParam ?? authenticationSession.getProjectId(),
    showClient: (key: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('client', key);
          return next;
        },
        { replace: true },
      ),
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

export function buildToolsParams({
  projectId,
  segment,
}: {
  projectId: string | null;
  segment: McpToolSegment;
}): Record<string, string> {
  return {
    ...(projectId === null ? {} : { project: projectId }),
    ...(segment === DEFAULT_SEGMENT ? {} : { segment }),
  };
}

function toTab(value: string | undefined): McpTab {
  return value === 'connections' || value === 'tools' || value === 'activity'
    ? value
    : 'connect';
}

function toSegment(value: string | null): McpToolSegment {
  return value === 'pieces' ? value : DEFAULT_SEGMENT;
}

function toProjectId(value: string | null): string | null {
  return ApId.safeParse(value).success ? value : null;
}

const DEFAULT_SEGMENT: McpToolSegment = 'built-in';

export type McpTab = 'connect' | 'tools' | 'connections' | 'activity';

export type McpToolSegment = 'built-in' | 'pieces';

export type McpNav = {
  tab: McpTab;
  segment: McpToolSegment;
  clientKey: string | null;
  projectId: string | null;
  showClient: (key: string) => void;
  showTab: (value: string) => void;
  selectSegment: (value: string) => void;
  selectProject: (projectId: string) => void;
};
