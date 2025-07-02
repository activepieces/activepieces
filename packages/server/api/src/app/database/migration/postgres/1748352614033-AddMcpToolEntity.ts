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

const log = system.globalLogger()
let totalPieces = 0

export class AddMcpToolEntity1748352614033 implements MigrationInterface {
    name = 'AddMcpToolEntity1748352614033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Starting migration AddMcpToolEntity1748352614033')

        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
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
        }

        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)

        log.info(`Migration AddMcpToolEntity1748352614033 completed successfully. Added ${totalPieces} MCP piece tools`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "name"
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
        `, [mcpTool.id, mcpTool.mcpId, mcpTool.type, mcpTool.pieceMetadata, mcpTool.created, mcpTool.updated])
    }))
}