import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { useEffect, useMemo } from 'react';

import {
  useStageOptional,
  StageExcerpt,
} from '@/app/components/workspace-shell/stage-context';
import { stageExcerptUtils } from '@/app/routes/chat-with-ai/lib/stage-excerpt';

// Publishes a compact snapshot of the visible connection rows (name, app,
// status, flow count) up to the Stage, so the chat can interpret terse on-screen
// references — e.g. the user asking about the "17 0 0" in the Flows column —
// without guessing or having to re-fetch blindly. Cleared on unmount.
export function useReportConnectionsExcerpt({
  connections,
  total,
}: {
  connections: AppConnectionWithoutSensitiveData[] | undefined;
  total: number | undefined;
}) {
  const stage = useStageOptional();
  const reportStageExcerpt = stage?.reportStageExcerpt;

  const excerpt = useMemo<StageExcerpt | null>(() => {
    if (!connections || connections.length === 0) {
      return null;
    }
    return {
      scopeType: 'connections',
      text: stageExcerptUtils.connectionsOutline({
        connections: connections.map((c) => ({
          displayName: c.displayName,
          pieceName: c.pieceName,
          status: c.status,
          flowCount: c.flowIds?.length,
        })),
        total: total ?? connections.length,
      }),
    };
  }, [connections, total]);

  useEffect(() => {
    reportStageExcerpt?.(excerpt);
  }, [reportStageExcerpt, excerpt]);

  useEffect(() => {
    return () => reportStageExcerpt?.(null);
  }, [reportStageExcerpt]);
}
