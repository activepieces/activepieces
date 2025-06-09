import { apId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

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

        await runInBatches(queryRunner, projectIds, 50, addDefaultMCPServers)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }
}

async function addDefaultMCPServers(queryRunner: QueryRunner, projectIds: string[]): Promise<void> {
    try {
        log.info(`Adding MCP servers for projects: ${projectIds.join(', ')}`)

        const ts = dayjs().toISOString()
        const mcpServers = projectIds.map((projectId) => ({
            id: apId(),
            projectId,
            name: 'Default Server',
            token: apId(),
            created: ts,
            updated: ts,
        }))

        const valuesSql: string[] = []
        const parameters: string[] = []

        mcpServers.forEach((server, index) => {
            const paramIndex = index * 6
            valuesSql.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`)
            parameters.push(server.id, server.projectId, server.name, server.token, server.created, server.updated)
        })

        const sql = `
            INSERT INTO "mcp" ("id", "projectId", "name", "token", "created", "updated")
            VALUES ${valuesSql.join(', ')}
        `

        await queryRunner.query(sql, parameters)
    }
    catch (e) {
        log.error(`Failed to create default MCP servers for projects: ${projectIds.join(', ')}`, e)
    }
}

async function runInBatches<T>(
    queryRunner: QueryRunner,
    items: T[],
    batchSize: number,
    func: (queryRunner: QueryRunner, items: T[]) => Promise<void>,
): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await func(queryRunner, batch)
    }
}
