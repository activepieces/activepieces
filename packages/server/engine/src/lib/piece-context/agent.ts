import { AgentContext, ConstructToolParams } from '@activepieces/pieces-framework'
import { AgentYield, AIProviderName, ContinueAgentRequest, ExecuteAiMode, isNil, RunAgentRequest } from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { agentTools, ResolveObject } from '../tools'
import { workerSocket } from '../worker-socket'

/**
 * Bridges `context.agent.{tools,run,continueRun}` to the worker AI service. The run-agent piece drives
 * the suspend/resume loop: `run` starts it, `continueRun` feeds piece-tool results back, and `tools`
 * returns the in-engine executors (run via flowExecutor on NEED_TOOLS) plus their descriptors (the
 * worker builds the LLM tool stubs from these). The engine injects the trusted server fields so the
 * sandbox never supplies them, and piece-tool prop-resolution is delegated to the worker over the AI
 * client (so provider credentials never enter the sandbox).
 */
export function createAgentContext({ constants, stepName }: CreateAgentContextParams): AgentContext {
    return {
        tools: ({ tools, provider, model }: ConstructToolParams) => agentTools.tools({
            engineConstants: constants,
            tools,
            resolveObject: buildResolveObject({ constants, stepName, provider, model }),
        }),
        run: (request: RunAgentRequest): Promise<AgentYield> => workerSocket.getAiWorkerClient().runAgent({
            ...request,
            engineToken: constants.engineToken,
            apiUrl: constants.internalApiUrl,
            publicUrl: constants.publicApiUrl,
            stepName,
            projectId: constants.projectId,
            runId: constants.flowRunId,
        }),
        continueRun: (request: ContinueAgentRequest): Promise<AgentYield> =>
            workerSocket.getAiWorkerClient().continueAgent(request),
    }
}

function buildResolveObject({ constants, stepName, provider, model }: BuildResolveObjectParams): ResolveObject {
    return async ({ prompt, schema }) => {
        const response = await workerSocket.getAiWorkerClient().executeAi({
            mode: ExecuteAiMode.TEXT,
            provider,
            model,
            engineToken: constants.engineToken,
            prompt,
            schema,
            projectId: constants.projectId,
            flowId: constants.flowId,
            runId: constants.flowRunId,
            stepName,
        })
        return isRecord(response.object) ? response.object : {}
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

type CreateAgentContextParams = {
    constants: EngineConstants
    stepName: string
}

type BuildResolveObjectParams = {
    constants: EngineConstants
    stepName: string
    provider: AIProviderName
    model: string
}
