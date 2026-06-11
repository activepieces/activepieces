import { AiContext, AiExecuteRequest } from '@activepieces/pieces-framework'
import { ExecuteAiResponse } from '@activepieces/shared'
import { workerSocket } from '../worker-socket'

/**
 * Bridges `context.ai.execute(...)` to the worker AI service over the dedicated generous-timeout
 * RPC client. The piece supplies only the request shape; the engine injects the trusted
 * `engineToken` (used server-side to resolve provider credentials and derive platform/project) plus
 * observability/provider-metadata ids — so provider credentials never enter the sandbox.
 */
export function createAiContext(params: CreateAiContextParams): AiContext {
    return {
        execute: (request: AiExecuteRequest): Promise<ExecuteAiResponse> =>
            workerSocket.getAiWorkerClient().executeAi({
                ...request,
                engineToken: params.engineToken,
                projectId: params.projectId,
                flowId: params.flowId,
                runId: params.runId,
                stepName: params.stepName,
            }),
    }
}

type CreateAiContextParams = {
    engineToken: string
    projectId: string
    flowId: string
    runId: string
    stepName: string
}
