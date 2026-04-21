import { AgentMcpTool, ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { mcpToolValidator } from './mcp-tool-validator'

export const agentToolsController: FastifyPluginAsyncZod = async (app) => {
    app.post('/mcp/validate', ValidateMcpToolRequest, async (req) => {
        return mcpToolValidator.validateAgentMcpTool(req.body)
    })
}

const ValidateMcpToolRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_FLOW,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['agent'],
        description: 'Probe an external MCP server configured as an agent tool and return its tool names. The outbound call is routed through the SSRF-filtered apAxios; all failure modes collapse to a single generic error so the response cannot be used for port or network reconnaissance.',
        params: z.object({
            projectId: ApId,
        }),
        body: AgentMcpTool,
    },
}
