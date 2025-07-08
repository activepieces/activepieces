import { apId } from '@activepieces/shared'
import { gt } from 'semver'
import { MigrationInterface, QueryRunner } from 'typeorm'

type OldMcpPieceToolData = {
    pieceName: string
    pieceVersion: string
    actionNames: string
    logoUrl: string
    connectionExternalId: string | null
}

enum McpToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

type PieceMetadata = {
    name: string
    displayName: string
}

export class SplitUpPieceMetadataIntoTools1752004202722 implements MigrationInterface {
    name = 'SplitUpPieceMetadataIntoTools1752004202722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const mcpTools = await queryRunner.query(`
            SELECT * FROM "mcp_tool" WHERE "pieceMetadata" IS NOT NULL
        `)

        const allPieceVersions = await queryRunner.query('SELECT name, version, actions FROM piece_metadata')
        
        const pieceNameToDisplayName = new Map<string, string>()
        const pieceNameToLatestVersion = new Map<string, string>()
        for (const piece of allPieceVersions) {
            const currentLatest = pieceNameToLatestVersion.get(piece.name)
            if (!currentLatest || gt(piece.version, currentLatest)) {
                pieceNameToLatestVersion.set(piece.name, piece.version)
                Object.values(piece.actions as PieceMetadata[]).forEach((action: PieceMetadata) => {
                    const actionName = `${piece.name}:${action.name}`
                    pieceNameToDisplayName.set(actionName, action.displayName)
                })
            }
        }

        for (const mcpTool of mcpTools) {            
            const { pieceMetadata: pieceMetadataString, ...rest } = mcpTool
            const pieceMetadata: OldMcpPieceToolData = pieceMetadataString as OldMcpPieceToolData
            const { actionNames, ...restPieceMetadata } = pieceMetadata
            
            for (const actionName of actionNames) {
                const pieceNameWithActionName = `${pieceMetadata.pieceName}:${actionName}`
                const actionDisplayName = pieceNameToDisplayName.get(pieceNameWithActionName) ?? actionName
                const tool = { 
                    ...rest, 
                    pieceMetadata: {
                        ...restPieceMetadata,
                        actionName,
                        actionDisplayName,
                    },
                }
                const toolId = apId()
                await queryRunner.query(`
                    INSERT INTO "mcp_tool" 
                    ("id", "mcpId", "type", "pieceMetadata", "flowId", "created", "updated")
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [toolId, tool.mcpId, McpToolType.PIECE, tool.pieceMetadata, tool.flowId, tool.created, tool.updated])

                const toolRuns = await queryRunner.query(`
                    SELECT * FROM "mcp_run" WHERE "metadata"->>'pieceName' = $1 AND "metadata"->>'actionName' = $2
                `, [tool.pieceMetadata.pieceName, actionName])

                for (const toolRun of toolRuns) {
                    await queryRunner.query(`
                        UPDATE "mcp_run" SET "toolId" = $1 WHERE "id" = $2
                    `, [toolId, toolRun.id])
                }
            }
            await queryRunner.query(`
                DELETE FROM "mcp_tool" WHERE "id" = $1
            `, [mcpTool.id])
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // no down
    }

}
