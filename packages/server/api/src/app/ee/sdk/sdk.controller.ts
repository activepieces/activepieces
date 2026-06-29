import { apId, Permission } from '@activepieces/core-utils'
import {
    CreateConnectLinkRequest,
    CreateConnectLinkResponse,
    CreateOrGetSdkProjectRequest,
    GetSdkPiecePropsRequest,
    McpServerType,
    McpToolResult,
    PrincipalType,
    ProjectScopedMcpServer,
    ProjectWithLimits,
    RunSdkActionRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { connectTokenService } from '../../helper/connect-token-service'
import { domainHelper } from '../../helper/domain-helper'
import { apGetPiecePropsTool } from '../../mcp/tools/ap-get-piece-props'
import { executeAdhocAction } from '../../mcp/tools/flow-run-utils'
import { platformProjectService } from '../projects/platform-project-service'
import { sdkProjectService } from './sdk-project-service'

export const sdkController: FastifyPluginAsyncZod = async (app) => {
    app.post('/projects', CreateOrGetProjectConfig, async (request): Promise<ProjectWithLimits> => {
        const platformId = request.principal.platform.id
        const { project } = await sdkProjectService(request.log).getOrCreateProject({
            platformId,
            externalProjectId: request.body.externalId,
        })
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(project.id)
    })

    app.post('/actions/run', RunActionConfig, async (request): Promise<McpToolResult> => {
        return executeAdhocAction({
            projectId: request.projectId,
            pieceName: request.body.pieceName,
            pieceVersion: request.body.pieceVersion,
            actionName: request.body.actionName,
            input: request.body.input,
            connectionExternalId: request.body.connectionExternalId,
            log: request.log,
        })
    })

    app.post('/pieces/props', GetPiecePropsConfig, async (request): Promise<McpToolResult> => {
        const tool = apGetPiecePropsTool(buildProjectScopedMcp({
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        }), request.log)
        return tool.execute({
            pieceName: request.body.pieceName,
            actionOrTriggerName: request.body.actionOrTriggerName,
            type: request.body.type,
            auth: request.body.auth,
            input: request.body.input,
        })
    })

    app.post('/connect/links', CreateConnectLinkConfig, async (request): Promise<CreateConnectLinkResponse> => {
        const { token, expiresAt } = await connectTokenService(request.log).issue({
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            pieceName: request.body.pieceName,
            externalId: request.body.externalId,
            displayName: request.body.displayName,
        })
        const redirectUrl = await domainHelper.getPublicUrl({ path: `/connect?token=${encodeURIComponent(token)}` })
        return { redirectUrl, externalId: request.body.externalId, expiresAt }
    })
}

function buildProjectScopedMcp({ projectId, platformId }: { projectId: string, platformId: string }): ProjectScopedMcpServer {
    const now = new Date().toISOString()
    return {
        id: apId(),
        created: now,
        updated: now,
        platformId,
        projectId,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

const CreateOrGetProjectConfig = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['sdk'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Create or get a project by its external id, scoped to the platform of the API key.',
        body: CreateOrGetSdkProjectRequest,
    },
}

const RunActionConfig = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_RUN,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['sdk'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Run a single piece action directly, without building a flow.',
        body: RunSdkActionRequest,
    },
}

const GetPiecePropsConfig = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['sdk'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get the input schema for a piece action or trigger, resolving dynamic options when a connection is supplied.',
        body: GetSdkPiecePropsRequest,
    },
}

const CreateConnectLinkConfig = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_APP_CONNECTION,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['sdk'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Create a hosted ConnectLink the user can open to connect an app (OAuth, API key, or custom auth).',
        body: CreateConnectLinkRequest,
    },
}
