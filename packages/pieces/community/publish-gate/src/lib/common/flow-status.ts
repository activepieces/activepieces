import {
  FlowsContext,
  FlowStatus,
  isNil,
  PopulatedFlowSummary,
} from '@activepieces/pieces-framework';

// `flows.list()` is typed as `PopulatedFlowSummary` since AP 0.86, but the
// engine endpoint behind it still serves full flow records, and the publish
// state lives only in those extra fields. They are read off this widened type;
// if the engine ever really strips them, every check below fails closed (the
// gate blocks) instead of letting a test run reach the real actions.
type GateFlow = PopulatedFlowSummary & {
  status?: string;
  publishedVersionId?: string | null;
};

/**
 * Loads the flow that the current run belongs to, so its publish state can be
 * inspected. The engine exposes the current flow id on `flows.current`, but not
 * its publish status, so the full record is fetched through `flows.list()`.
 */
export async function getCurrentFlowOrThrow({
  flows,
}: {
  flows: FlowsContext;
}): Promise<GateFlow> {
  const currentFlowId = flows.current.id;
  const allFlows = await listFlowsOrThrow({ flows });
  const currentFlow = allFlows.find((flow) => flow.id === currentFlowId);
  if (isNil(currentFlow)) {
    throw new Error(
      'Publish Gate could not find the current automation while checking whether it is published.'
    );
  }
  return currentFlow;
}

/**
 * Decides whether the steps after the gate are allowed to run.
 *
 * - `live`: only a real run of the published, switched-on automation passes.
 *   Test/draft runs are blocked even after the automation has been published,
 *   because they execute a different (draft) version than the published one.
 * - `published`: passes as long as the automation has a published version,
 *   which also lets test runs through once it has been published at least once.
 */
export function isPublishedForMode({
  flow,
  runningVersionId,
  mode,
}: {
  flow: GateFlow;
  runningVersionId: string;
  mode: PublishGateMode;
}): boolean {
  const hasPublishedVersion = !isNil(flow.publishedVersionId);
  if (mode === 'published') {
    return hasPublishedVersion;
  }
  const isSwitchedOn = flow.status === FlowStatus.ENABLED;
  const isRunningPublishedVersion = flow.publishedVersionId === runningVersionId;
  return hasPublishedVersion && isSwitchedOn && isRunningPublishedVersion;
}

async function listFlowsOrThrow({
  flows,
}: {
  flows: FlowsContext;
}): Promise<GateFlow[]> {
  try {
    const page = await flows.list();
    return page.data as GateFlow[];
  } catch {
    throw new Error(
      "Publish Gate could not check the automation's publish status. Please try running it again."
    );
  }
}

export const PUBLISH_GATE_MODES = ['live', 'published'] as const;
export type PublishGateMode = (typeof PUBLISH_GATE_MODES)[number];
