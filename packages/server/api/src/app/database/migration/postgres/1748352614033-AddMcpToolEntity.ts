import { ActionBase } from '@activepieces/pieces-framework'
import { ApId, apId, AppConnectionWithoutSensitiveData, assertNotNullOrUndefined, BaseModelSchema, Flow, FlowVersion, isNil, McpPieceToolData, McpTool, McpToolType, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { gt } from 'semver'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

enum McpPieceStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

const McpPiece = Type.Object({
    ...BaseModelSchema,
    pieceName: Type.String(),
    connectionId: Type.Optional(ApId),
    mcpId: ApId,
    status: Type.Optional(Type.Enum(McpPieceStatus)),
})

type McpPiece = Static<typeof McpPiece>

const McpPieceWithConnection = Type.Composite([
    McpPiece,
    Type.Object({
        connection: Type.Optional(AppConnectionWithoutSensitiveData),
    }),
])

type McpPieceWithConnection = Static<typeof McpPieceWithConnection>

function isMcpTriggerPiece(flowVersion: FlowVersion): boolean {
    return flowVersion.trigger.type === TriggerType.PIECE && 
           flowVersion.trigger.settings.pieceName === '@activepieces/piece-mcp'
}

const log = system.globalLogger()
let totalPieces = 0
let totalFlows = 0

export class AddMcpToolEntity1748352614033 implements MigrationInterface {
    name = 'AddMcpToolEntity1748352614033'

    public async up(queryRunner: QueryRunner): Promise<void> {

        log.info('Starting migration AddMcpToolEntity1748352614033')

        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "type" character varying NOT NULL,
                "pieceMetadata" jsonb,
                "flowId" character varying,
                CONSTRAINT "PK_ba54d700cb4059f5f48121840bd" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "name" character varying NOT NULL DEFAULT 'MCP Server'
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        
        const mcps = await queryRunner.query(`
            SELECT * FROM "mcp"
        `)

        const allPieceVersions = await queryRunner.query('SELECT name, version, actions, "logoUrl" FROM piece_metadata')

        // Create a map of piece names to their latest versions
        const pieceNameToLatestVersion = new Map<string, { version: string, actions: Record<string, ActionBase>, logoUrl: string }>()
        for (const piece of allPieceVersions) {
            const currentLatest = pieceNameToLatestVersion.get(piece.name)
            if (!currentLatest || gt(piece.version, currentLatest.version)) {
                pieceNameToLatestVersion.set(piece.name, { version: piece.version, actions: piece.actions, logoUrl: piece.logoUrl })
            }
        }

        for (const mcp of mcps) {
            await AddMcpPieceTools(queryRunner, mcp.id, pieceNameToLatestVersion)
            await AddMcpFlowTools(queryRunner, mcp.id, mcp.projectId)
        }

        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)

        log.info(`Migration AddMcpToolEntity1748352614033 completed successfully. Added ${totalPieces} MCP piece tools and ${totalFlows} MCP flow tools`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "name"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}


async function AddMcpPieceTools(queryRunner: QueryRunner, mcpId: string, pieceNameToLatestVersion: Map<string, { version: string, actions: Record<string, ActionBase>, logoUrl: string }>) {
    const pieces = await queryRunner.query(`
        SELECT * FROM "mcp_piece" WHERE "mcpId" = $1
    `, [mcpId])

    totalPieces += pieces.length
    log.info(`Adding ${pieces.length} MCP piece tools for MCP ${mcpId}`)

    await Promise.all(pieces.map(async (piece: McpPieceWithConnection) => {
        const pieceMetadataInfo = pieceNameToLatestVersion.get(piece.pieceName)

        assertNotNullOrUndefined(pieceMetadataInfo, `Piece metadata not found for piece ${piece.pieceName}`)

        let connectionExternalId: string | undefined
        if (!isNil(piece.connectionId)) {
            const connection = await queryRunner.query(`
                SELECT "externalId" FROM "app_connection" WHERE "id" = $1
            `, [piece.connectionId])

            assertNotNullOrUndefined(connection[0].externalId, `Connection external id not found for piece ${piece.pieceName} with connection id ${piece.connectionId}`)
            connectionExternalId = connection[0].externalId
        }

        const pieceMetadata: McpPieceToolData = {
            pieceName: piece.pieceName,
            pieceVersion: pieceMetadataInfo.version,
            actionNames: Array.from(Object.keys(pieceMetadataInfo.actions)),
            logoUrl: pieceMetadataInfo.logoUrl,
            connectionExternalId,   
        }

        const mcpTool: McpTool = {
            id: apId(),
            mcpId,
            type: McpToolType.PIECE,
            pieceMetadata,
            flowId: undefined,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        }

        await queryRunner.query(`
            INSERT INTO "mcp_tool" ("id", "mcpId", "type", "pieceMetadata", "created", "updated") VALUES ($1, $2, $3, $4, $5, $6)
        `, [mcpTool.id, mcpTool.mcpId, mcpTool.type, mcpTool.pieceMetadata, mcpTool.created, mcpTool.updated])
    }))
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