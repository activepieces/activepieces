import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, CreateMCPServerFromStepParams, flowStructureUtil, McpTool } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { mcpServerHandler } from '../../../mcp/mcp-server/mcp-server-handler'
import { flowService } from '../flow.service'
import { flowMcpSessionManager } from './flow-mcp-session-manager'

export const flowMcpController: FastifyPluginAsyncTypebox = async (fastify) => {
    const sessionManager = flowMcpSessionManager(fastify.log)
    
    fastify.post('/:flowId/versions/:flowVersionId/steps/:stepName/mcp-server', CreateMCPServerFromStepRequest, async (request, reply) => {
        const sessionId = request.headers['mcp-session-id'] as string | undefined
        
        if (!sessionId && !isInitializeRequest(request.body)) {
            await reply.status(400).send({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            })
            return reply
        }

        const flowVersion = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.flowId,
            projectId: request.principal.projectId,
            versionId: request.params.flowVersionId,
        })

        const step = flowStructureUtil.getStepOrThrow(request.params.stepName, flowVersion.version.trigger)
        const tools = step.settings?.input?.agentTools ?? []
        assertNotNullOrUndefined(tools, 'Tools are required')
        const toolsWithMcpId = tools.map((tool: McpTool) => ({
            ...tool,
            mcpId: tool.mcpId ?? `flow:${request.params.flowId}`
        }))
        await mcpServerHandler.handleStreamableHttpRequest({
            req: request,
            reply,
            projectId: flowVersion.projectId,
            logger: request.log,
            tools: toolsWithMcpId,
            sessionManager,
        })

        return reply
    })
}

const CreateMCPServerFromStepRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES
    },
    schema: {
        params: CreateMCPServerFromStepParams,
    },
}
