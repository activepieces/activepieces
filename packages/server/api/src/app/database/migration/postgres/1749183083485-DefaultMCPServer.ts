import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { mcpService } from '../../../mcp/mcp-service'

const log = system.globalLogger()

export class DefaultMCPServer1749183083485 implements MigrationInterface {
    name = 'DefaultMCPServer1749183083485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Starting migration DefaultMCPServer1749183083485')

        const oldestProjectsPerAdminPlatform: { id: string }[] = await queryRunner.query(`
            SELECT DISTINCT ON (p."platformId") p.id
            FROM project p
            WHERE p."platformId" IN (
                SELECT u."platformId"
                FROM "user" u
                WHERE u."platformRole" = 'ADMIN'
            )
            ORDER BY p."platformId", p.created ASC;
        `)

        const projectIds = oldestProjectsPerAdminPlatform.map((item) => item.id)

        await runInBatches(projectIds, 50, addDefaultMCPServer)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }
}

async function addDefaultMCPServer(projectId: string): Promise<void> {
    try {
        log.info(`Adding MCP server for project ${projectId}`)
        await mcpService(log).create({
            projectId,
            name: 'Default Server',
        })
    }
    catch (e) {
        log.error(`Failed to create default MCP server for project ${projectId}`, e)
    }
}

async function runInBatches<T>(items: T[], batchSize: number, func: (item: T) => Promise<void>): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await Promise.all(batch.map(item => func(item)))
    }
}
