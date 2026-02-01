import {
    AIProviderName,
    EngineResponse,
    EngineResponseStatus,
    ExecuteToolOperation,
    ExecuteToolResponse,
    ExecutionError,
    ExecutionErrorType,
    GetProviderConfigResponse,
    isNil,
} from '@activepieces/shared'
import { LanguageModel } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { agentToolExecutor } from '../handler/agent-tool-executor'

export const toolOperation = {
    execute: async (operation: ExecuteToolOperation): Promise<EngineResponse<ExecuteToolResponse>> => {
        if (isNil(operation.modelId)) {
            throw new ExecutionError('Missing modelId', 'modelId is required for EXECUTE_TOOL operation', ExecutionErrorType.ENGINE)
        }
        const model = await getModel(operation.modelId, operation.engineToken, operation.internalApiUrl)
        const output = await agentToolExecutor.execute({
            ...operation,
            model,
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

async function getModel(modelId: string, engineToken: string, internalApiUrl: string): Promise<LanguageModel> {
    const baseUrl = removeTrailingSlash(internalApiUrl)
    const response = await fetch(`${baseUrl}/v1/ai-providers/${AIProviderName.ACTIVEPIECES}/config`, {
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    })
    const config = await response.json() as GetProviderConfigResponse
    return createOpenRouter({ apiKey: config.auth.apiKey }).chat(modelId)
}
