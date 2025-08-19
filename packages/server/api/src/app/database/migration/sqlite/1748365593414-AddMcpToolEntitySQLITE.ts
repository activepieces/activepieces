import { ActionBase } from '@activepieces/pieces-framework'
import { apId } from '@activepieces/shared'
import { gt } from 'semver'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

type ApId = string

type BaseModel = {
    id: ApId
    created: string
    updated: string
}

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

type AppConnectionWithoutSensitiveData = {
    id: string
    externalId: string
}

enum McpPieceStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

type McpPiece = {
    pieceName: string
    connectionId?: ApId
    mcpId: ApId
    status?: McpPieceStatus
} & BaseModel

type McpPieceWithConnection = {
    connection?: AppConnectionWithoutSensitiveData
} & McpPiece



function assertNotNullOrUndefined<T>(value: T | null | undefined, message: string): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(message)
    }
}

function isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

function isMcpTriggerPiece(trigger: { type: TriggerType, settings: { pieceName: string } }): boolean {
    return trigger.type === TriggerType.PIECE && trigger.settings.pieceName === '@activepieces/piece-mcp'
}

const log = system.globalLogger()
let totalPieces = 0
let totalFlows = 0

export class AddMcpToolEntitySQLITE1748365593414 implements MigrationInterface {
    name = 'AddMcpToolEntitySQLITE1748365593414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL,
                "name" varchar NOT NULL DEFAULT ('MCP Server')
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"("id", "created", "updated", "projectId", "token")
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId"
            FROM "mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_tool"
                RENAME TO "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
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
                pieceNameToLatestVersion.set(piece.name, { version: piece.version, actions: JSON.parse(piece.actions), logoUrl: piece.logoUrl })
            }
        }

        for (const mcp of mcps) {
            await AddMcpPieceTools(queryRunner, mcp.id, pieceNameToLatestVersion)
            await AddMcpFlowTools(queryRunner, mcp.id, mcp.projectId)
        }

        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)

        log.info(`Migration AddMcpToolEntitySQLITE1748365593414 completed successfully. Added ${totalPieces} MCP piece tools and ${totalFlows} MCP flow tools`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
                RENAME TO "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId"
            FROM "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"("id", "created", "updated", "projectId", "token")
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
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
        `, [mcpTool.id, mcpTool.mcpId, mcpTool.type, JSON.stringify(mcpTool.pieceMetadata), mcpTool.created, mcpTool.updated])
    }))
}

async function AddMcpFlowTools(queryRunner: QueryRunner, mcpId: string, projectId: string) {
    const flows = await queryRunner.query(`
        SELECT * FROM "flow" WHERE "projectId" = ? AND "status" = 'ENABLED' AND "publishedVersionId" IS NOT NULL
    `, [projectId])

    const populatedFlows = await Promise.all(flows.map(async (flow: Flow) => {
        const version = await queryRunner.query(`
            SELECT * FROM "flow_version" WHERE "id" = ?
        `, [flow.publishedVersionId])


        if (isNil(version) || version.length === 0) {
            return null
        }

        const trigger = JSON.parse(version[0].trigger)
        if (!isMcpTriggerPiece(trigger)) {
            return null
        }

        return {
            ...flow,
            version,
        }
    }))

    const populatedFlowsCount = populatedFlows.filter((flow) => !isNil(flow)).length
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
            INSERT INTO "mcp_tool" ("id", "mcpId", "type", "flowId", "created", "updated") VALUES (?, ?, ?, ?, ?, ?)
        `, [mcpTool.id, mcpTool.mcpId, mcpTool.type, mcpTool.flowId, mcpTool.created, mcpTool.updated])
    }))
}