import { EngineResponse, EngineResponseStatus, ExecuteToolOperation, ExecuteToolResponse } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { agentTools } from '../tools'

export const toolsOperation = {
    execute: async (operation: ExecuteToolOperation): Promise<EngineResponse<ExecuteToolResponse>> => {
        const provider = createOpenAI({
            apiKey: operation.engineToken,
            baseURL: `${operation.publicApiUrl}v1/ai-providers/proxy/openai/v1`,
            headers: {
                'Authorization': `Bearer ${operation.engineToken}`,
                'ap-feature': 'MCP',
                'ap-mcp-id': `tool:${operation.actionName}`,
            },
        })
        const response = await agentTools.execute({
            ...operation,
            model: provider.chat('gpt-4.1'),
        })
        return {
            status: EngineResponseStatus.OK,
            response,
        }
    },
}