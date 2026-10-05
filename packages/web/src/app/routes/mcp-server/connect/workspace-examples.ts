import { FlowStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { appConnectionsQueries } from '@/features/connections/hooks/app-connections-hooks';
import { flowsApi } from '@/features/flows/api/flows-api';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';

function useExamples(): WorkspaceExamples {
  const projectId = authenticationSession.getProjectId();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: flows } = useQuery({
    queryKey: ['mcp-workspace-examples-flows', projectId],
    queryFn: () =>
      flowsApi.list({
        projectId: projectId ?? '',
        limit: FLOWS_TO_SCAN,
        cursor: undefined,
      }),
    enabled: projectId !== null,
    staleTime: EXAMPLES_STALE_MS,
  });
  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: { projectId: projectId ?? '', limit: CONNECTIONS_TO_SCAN },
    extraKeys: ['mcp-workspace-examples', projectId],
    enabled: projectId !== null,
  });
  const enabledFlow = flows?.data.find(
    (flow) => flow.status === FlowStatus.ENABLED,
  );
  const pieceNames = [
    ...new Set((connections?.data ?? []).map((c) => c.pieceName)),
  ];
  const { summary } = piecesHooks.usePieceSummary({
    name: pieceNames[0] ?? '',
  });

  return {
    projectName: project?.displayName,
    flowName: enabledFlow?.version.displayName,
    appName: pieceNames.length > 0 ? summary?.displayName : undefined,
    connectedPieceNames: pieceNames,
  };
}

export const mcpWorkspaceHooks = { useExamples };

const FLOWS_TO_SCAN = 25;
const CONNECTIONS_TO_SCAN = 10;
const EXAMPLES_STALE_MS = 60 * 1000;

export type WorkspaceExamples = {
  projectName: string | undefined;
  flowName: string | undefined;
  appName: string | undefined;
  connectedPieceNames: string[];
};
