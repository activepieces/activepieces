import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

type ApId = string

enum McpToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

enum TriggerType {
    PIECE = 'PIECE_TRIGGER',
}

type McpPieceToolData = {
    pieceName: string
    pieceVersion: string
    actionNames: string[]
    logoUrl: string
    connectionExternalId?: string
}

type McpTool = {
    id: ApId
    created: string
    updated: string
    mcpId: ApId
    type: McpToolType
    pieceMetadata?: McpPieceToolData
    flowId?: string
}

type Flow = {
    id: string
    publishedVersionId: string
}

type FlowVersion = {
    id: string
    trigger: {
        type: TriggerType
        settings: {
            pieceName: string
        }
    }
}

function isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

function isMcpTriggerPiece(flowVersion: FlowVersion): boolean {
    return flowVersion.trigger.type === TriggerType.PIECE && 
           flowVersion.trigger.settings.pieceName === '@activepieces/piece-mcp'
}

const log = system.globalLogger()
let totalFlows = 0

export class MigrateMcpFlowsToBeTools1748996336492 implements MigrationInterface {
    name = 'MigrateMcpFlowsToBeTools1748996336492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Starting migration MigrateMcpFlowsToBeTools1748996336492')

        const mcps = await queryRunner.query(`
            SELECT * FROM "mcp"
        `)

        for (const mcp of mcps) {
            await AddMcpFlowTools(queryRunner, mcp.id, mcp.projectId)
        }

        log.info(`Migration MigrateMcpFlowsToBeTools1748996336492 completed successfully. Added ${totalFlows} MCP flow tools`)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }

}

async function AddMcpFlowTools(queryRunner: QueryRunner, mcpId: string, projectId: string) {
    const flows = await queryRunner.query(`
        SELECT * FROM "flow" WHERE "projectId" = $1 AND "status" = 'ENABLED' AND "publishedVersionId" IS NOT NULL
    `, [projectId])

    const populatedFlows = await Promise.all(flows.map(async (flow: Flow) => {
        const version = await queryRunner.query(`
            SELECT * FROM "flow_version" WHERE "id" = $1
        `, [flow.publishedVersionId])

        if (isNil(version) || version.length === 0 || !isMcpTriggerPiece(version[0])) {
            return null
        }

        return {
            ...flow,
            version,
        }
    }))

    const populatedFlowsCount = populatedFlows.filter((flow) => flow !== null).length
    totalFlows += populatedFlowsCount
    log.info(`Adding ${populatedFlowsCount} MCP flow tools out of ${flows.length} flows for MCP ${mcpId} and project ${projectId}`)

    await Promise.all(populatedFlows.map(async (flow: Flow | null) => {
        if (isNil(flow)) {
            return
        }

        const mcpTool: McpTool = {
            id: apId(),
            mcpId,
            type: McpToolType.FLOW,
            flowId: flow.id,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        }

        await queryRunner.query(`
            INSERT INTO "mcp_tool" ("id", "mcpId", "type", "flowId", "created", "updated") VALUES ($1, $2, $3, $4, $5, $6)
        `, [mcpTool.id, mcpTool.mcpId, mcpTool.type, mcpTool.flowId, mcpTool.created, mcpTool.updated])
    }))
}