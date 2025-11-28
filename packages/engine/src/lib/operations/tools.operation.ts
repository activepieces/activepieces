import { EngineResponse, ExecuteToolOperation, ExecuteToolResponse } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { mcpExecutor } from '../mcp'

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
        return mcpExecutor.execute({
            ...operation,
            model: provider.chat('gpt-4.1'),
        })
    },
}