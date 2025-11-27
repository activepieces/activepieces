import { EngineResponse, ExecuteToolOperation, ExecuteToolResponse } from "@activepieces/shared"
import { mcpExecutor } from "../mcp"
import { createOpenAI } from '@ai-sdk/openai'

export const toolsOperation = {
    execute: async (operation: ExecuteToolOperation): Promise<EngineResponse<ExecuteToolResponse>> => {
        const provider = createOpenAI({
            apiKey: operation.engineToken,
            baseURL: `${operation.publicApiUrl}/v1`,
            headers: {
                'Authorization': `Bearer ${operation.engineToken}`,
                'ap-feature': 'MCP',
            },
        })
        return mcpExecutor.execute({
            ...operation,
            model: provider.chat('gpt-4.1'),
        })
    }
}