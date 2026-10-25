import {
  GetFlowQueryParamsRequest,
  isNil,
  PopulatedFlow,
  tryCatch,
} from '@activepieces/shared';

export type RunDiscardDeps = {
  flow: { id: string; publishedVersionId?: string | null };
  savePendingEdits: () => Promise<void>;
  refreshDraftAfterFailedSave: () => Promise<void>;
  overWriteDraftWithVersion: (params: {
    flowId: string;
    versionId: string;
  }) => Promise<unknown>;
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
  const { error: saveError } = await tryCatch(async () => {
    await deps.savePendingEdits();
    await deps.refreshDraftAfterFailedSave();
  });
  if (!isNil(saveError)) {
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
