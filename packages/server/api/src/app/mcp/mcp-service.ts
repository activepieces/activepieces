import { apId, FlowTriggerType, FlowVersionState, isNil, MCP_TRIGGER_PIECE_NAME, McpServer as McpServerSchema, McpServerType, PopulatedFlow, PopulatedMcpServer, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'
import { McpServerEntity } from './mcp-entity'
import { buildMcpServer } from './mcp-server-builder'

export const mcpServerRepository = repoFactory(McpServerEntity)

export const mcpServerService = (log: FastifyBaseLogger) => ({
    getByProjectId: async (projectId: string): Promise<McpServerSchema> => {
        return getOrCreate({
            where: { projectId },
            defaults: { type: McpServerType.PROJECT, projectId, platformId: null },
        })
    },

    getByPlatformId: async (platformId: string): Promise<McpServerSchema> => {
        return getOrCreate({
            where: { platformId },
            defaults: { type: McpServerType.PLATFORM, platformId, projectId: null },
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

    update: async ({ projectId, disabledTools }: UpdateParams): Promise<PopulatedMcpServer> => {
        const mcp = await mcpServerService(log).getByProjectId(projectId)
        if (!isNil(disabledTools)) {
            await mcpServerRepository().update(mcp.id, { disabledTools })
        }
        return mcpServerService(log).getPopulatedByProjectId(projectId)
    },

    updatePlatform: async ({ platformId, disabledTools }: UpdatePlatformParams): Promise<McpServerSchema> => {
        const mcp = await mcpServerService(log).getByPlatformId(platformId)
        if (!isNil(disabledTools)) {
            await mcpServerRepository().update(mcp.id, { disabledTools })
        }
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
    defaults: { type: McpServerType, projectId: string | null, platformId: string | null }
}): Promise<McpServerSchema> {
    const existing = await mcpServerRepository().findOneBy(where)
    if (!isNil(existing)) return existing
    const { data: created, error } = await tryCatch(async () =>
        mcpServerRepository().save({
            id: apId(),
            ...defaults,
            token: apId(72),
            disabledTools: [],
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
    disabledTools?: string[]
}

type UpdatePlatformParams = {
    platformId: string
    disabledTools?: string[]
}
