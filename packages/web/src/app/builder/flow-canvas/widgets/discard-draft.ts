import { GetFlowQueryParamsRequest, PopulatedFlow } from '@activepieces/shared';

export type RunDiscardDeps = {
  flow: { id: string; publishedVersionId?: string | null };
  requiresApproval: boolean;
  overWriteDraftWithVersion: (params: {
    flowId: string;
    versionId: string;
  }) => Promise<unknown>;
  publish: () => Promise<unknown>;
  fetchFlow: (
    flowId: string,
    request: GetFlowQueryParamsRequest,
  ) => Promise<PopulatedFlow>;
  setFlow: (flow: PopulatedFlow) => void;
  setVersion: (version: PopulatedFlow['version']) => void;
};

export async function runDiscard(deps: RunDiscardDeps): Promise<void> {
  const { flow } = deps;
  if (!flow.publishedVersionId) {
    return;
  }
  await deps.overWriteDraftWithVersion({
    flowId: flow.id,
    versionId: flow.publishedVersionId,
  });
  const published = await deps.fetchFlow(flow.id, {
    versionId: flow.publishedVersionId,
  });
  deps.setFlow(published);
  deps.setVersion(published.version);
}
