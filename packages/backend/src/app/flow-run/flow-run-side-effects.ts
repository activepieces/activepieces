import { FlowRun } from "@activepieces/shared";
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
                projectId: flowRun.projectId,
                environment: flowRun.environment,
                runId: flowRun.id,
                flowVersionId: flowRun.flowVersionId,
                collectionId: flowRun.collectionId,
                payload,
            },
        });
    },
};
