import { apId, FlowTriggerType, FlowVersionState, isNil, MCP_TRIGGER_PIECE_NAME, McpServer as McpServerSchema, McpServerStatus, McpServerType, PopulatedFlow, PopulatedMcpServer, spreadIfNotUndefined, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'
import { McpServerEntity } from './mcp-entity'
import { buildMcpServer } from './mcp-server-builder'
import { ALL_CONTROLLABLE_TOOL_NAMES } from './tools'

export const mcpServerRepository = repoFactory(McpServerEntity)

export const mcpServerService = (log: FastifyBaseLogger) => ({
    getByProjectId: async (projectId: string): Promise<McpServerSchema> => {
        return getOrCreate({
            where: { projectId },
            defaults: { type: McpServerType.PROJECT, status: McpServerStatus.DISABLED, projectId, platformId: null },
        })
    },

    getByPlatformId: async (platformId: string): Promise<McpServerSchema> => {
        return getOrCreate({
            where: { platformId },
            defaults: { type: McpServerType.PLATFORM, status: McpServerStatus.ENABLED, platformId, projectId: null },
        })
    },

    getPopulatedByProjectId: async (projectId: string): Promise<PopulatedMcpServer> => {
        const mcp = await mcpServerService(log).getByProjectId(projectId)
        const flows = await listMcpFlows(projectId, log)
        return { ...mcp, flows }
    },

    getPopulatedByPlatformId: async (platformId: string): Promise<PopulatedMcpServer> => {
        const mcp = await mcpServerService(log).getByPlatformId(platformId)
        return { ...mcp, flows: [] }
    },

    rotateToken: async ({ projectId }: { projectId: string }): Promise<PopulatedMcpServer> => {
        const mcp = await mcpServerService(log).getByProjectId(projectId)
        await mcpServerRepository().update(mcp.id, { token: apId(72) })
        return mcpServerService(log).getPopulatedByProjectId(projectId)
    },

    rotatePlatformToken: async ({ platformId }: { platformId: string }): Promise<McpServerSchema> => {
        const mcp = await mcpServerService(log).getByPlatformId(platformId)
        await mcpServerRepository().update(mcp.id, { token: apId(72) })
        return mcpServerService(log).getByPlatformId(platformId)
    },

    update: async ({ projectId, status, enabledTools }: UpdateParams): Promise<PopulatedMcpServer> => {
        const mcp = await mcpServerService(log).getByProjectId(projectId)
        await applyPatch(mcp.id, { status, enabledTools })
        return mcpServerService(log).getPopulatedByProjectId(projectId)
    },

    updatePlatform: async ({ platformId, status, enabledTools }: UpdatePlatformParams): Promise<McpServerSchema> => {
        const mcp = await mcpServerService(log).getByPlatformId(platformId)
        await applyPatch(mcp.id, { status, enabledTools })
        return mcpServerService(log).getByPlatformId(platformId)
    },

    buildServer: async ({ mcp, userId }: { mcp: PopulatedMcpServer, userId: string | null }) => {
        return buildMcpServer({
            mcp,
            userId,
            log,
            resolveProjectMcp: (projectId: string) => mcpServerService(log).getPopulatedByProjectId(projectId),
        })
    },
})

async function getOrCreate({ where, defaults }: {
    where: { projectId: string } | { platformId: string }
    defaults: { type: McpServerType, status: McpServerStatus, projectId: string | null, platformId: string | null }
}): Promise<McpServerSchema> {
    const existing = await mcpServerRepository().findOneBy(where)
    if (!isNil(existing)) return existing
    const { data: created, error } = await tryCatch(async () =>
        mcpServerRepository().save({
            id: apId(),
            ...defaults,
            token: apId(72),
            enabledTools: ALL_CONTROLLABLE_TOOL_NAMES,
        }),
    )
    if (error) {
        // Unique constraint violation from a concurrent insert — the other request won
        const fallback = await mcpServerRepository().findOneBy(where)
        if (!isNil(fallback)) return fallback
        throw error
    }
    return created
}

async function applyPatch(id: string, { status, enabledTools }: { status?: McpServerStatus, enabledTools?: string[] }): Promise<void> {
    const patch = {
        ...spreadIfNotUndefined('status', status),
        ...spreadIfNotUndefined('enabledTools', enabledTools),
    }
    if (Object.keys(patch).length > 0) {
        await mcpServerRepository().update(id, patch)
    }
}

async function listMcpFlows(projectId: string, logger: FastifyBaseLogger): Promise<PopulatedFlow[]> {
    const flows = await flowService(logger).list({
        projectIds: [projectId],
        limit: 1000000,
        cursorRequest: null,
        versionState: FlowVersionState.DRAFT,
        includeTriggerSource: false,
    })
    return flows.data.filter((flow) => flow.version.trigger.type === FlowTriggerType.PIECE && flow.version.trigger.settings.pieceName === MCP_TRIGGER_PIECE_NAME)
}

type UpdateParams = {
    projectId: string
    status?: McpServerStatus
    enabledTools?: string[]
}

type UpdatePlatformParams = {
    platformId: string
    status?: McpServerStatus
    enabledTools?: string[]
}
