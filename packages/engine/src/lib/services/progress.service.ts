import { UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

const lock = new Mutex()

export const progressService = {
    sendUpdate: (() => {
        let timeoutId: NodeJS.Timeout | null = null;
        let isRequestPending = false;

        return async (params: UpdateStepProgressParams): Promise<void> => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            const now = Date.now();
            const { lastActionExecutionTime } = params;

            if (lastActionExecutionTime && (now - lastActionExecutionTime > 4000)) {
                await sendRequest(params);
                isRequestPending = false;
                return;
            }

            isRequestPending = true;

            timeoutId = setTimeout(async () => {
                if (isRequestPending) {
                    await sendRequest(params);
                    isRequestPending = false;
                }
            }, 15000); 
        };

        async function sendRequest(params: UpdateStepProgressParams): Promise<void> {
            await lock.runExclusive(async () => {
                const { flowExecutorContext, engineConstants } = params;
                const url = new URL(`${engineConstants.internalApiUrl}v1/engine/update-run`);
                const request: UpdateRunProgressRequest = {
                    runId: engineConstants.flowRunId,
                    workerHandlerId: engineConstants.serverHandlerId ?? null,
                    httpRequestId: engineConstants.httpRequestId ?? null,
                    runDetails: await flowExecutorContext.toResponse(),
                    progressUpdateType: engineConstants.progressUpdateType,
                };

                await fetch(url.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${engineConstants.engineToken}`,
                    },
                    body: JSON.stringify(request),
                });
            });
        }
    })(),
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    lastActionExecutionTime?: number
}
