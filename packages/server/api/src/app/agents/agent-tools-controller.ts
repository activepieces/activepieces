import { ApId, Permission } from '@activepieces/core-utils'
import { AgentMcpTool, mcpEndpointAllowlistUtil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { mcpToolValidator } from './mcp-tool-validator'

export const agentToolsController: FastifyPluginAsyncZod = async (app) => {
    app.post('/mcp/validate', ValidateMcpToolRequest, async (req) => {
        const platformId = await projectService(req.log).getPlatformId(req.params.projectId)
        const platform = await platformService(req.log).getOneOrThrow(platformId)
        const approved = mcpEndpointAllowlistUtil.isServerUrlApproved({
            serverUrl: req.body.serverUrl,
            allowlist: platform.mcpServerEndpointAllowlist,
        })
        if (!approved) {
            return { toolNames: undefined, error: NOT_APPROVED_ERROR }
        }
        return mcpToolValidator.validateAgentMcpTool(req.body)
    })
}

const NOT_APPROVED_ERROR = 'This MCP server endpoint is not on the list of endpoints approved by your platform admin.'

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
        description: 'Probe an external MCP server configured as an agent tool and return its tool names. The outbound call is routed through the SSRF-filtered safeHttp axios; all failure modes collapse to a single generic error so the response cannot be used for port or network reconnaissance.',
        params: z.object({
            projectId: ApId,
        }),
        body: AgentMcpTool,
    },
}
