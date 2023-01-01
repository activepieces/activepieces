import { FlowRun } from "shared";
import { flowQueue } from "../workers/flow-worker/flow-queue";

interface StartParams {
  flowRun: FlowRun;
  payload: unknown;
}

export const flowRunSideEffects = {
  async start({ flowRun, payload }: StartParams): Promise<void> {
    await flowQueue.add({
      id: flowRun.id,
      data: {
        runId: flowRun.id,
        instanceId: flowRun.instanceId,
        flowVersionId: flowRun.flowVersionId,
        collectionVersionId: flowRun.collectionVersionId,
        payload,
      },
    });
  },
};
