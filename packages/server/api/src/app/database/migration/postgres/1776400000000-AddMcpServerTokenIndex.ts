import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddMcpServerTokenIndex1776400000000 implements MigrationInterface {
    name = 'AddMcpServerTokenIndex1776400000000'
    release = '0.83.0'
    breaking = false
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "idx_mcp_server_token"
                ON "mcp_server" ("token")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_mcp_server_token"
                ON "mcp_server" ("token")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_server_token"')
    }
}
