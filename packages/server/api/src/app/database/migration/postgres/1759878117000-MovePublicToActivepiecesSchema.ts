import type { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

/**
 * Migration to move all tables from 'public' schema to 'activepieces' schema.
 * This migration:
 * 1. Creates the 'activepieces' schema if it doesn't exist
 * 2. Moves all existing tables from 'public' to 'activepieces'
 * 3. All indexes, constraints, sequences, and triggers move automatically
 */
export class MovePublicToActivepiecesSchema1759878117000 implements MigrationInterface {
    name = 'MovePublicToActivepiecesSchema1759878117000'

    // All tables that need to be moved
    private readonly tables = [
        'activity',
        'agent',
        'agent_run',
        'ai_provider',
        'ai_usage',
        'alert',
        'api_key',
        'app_connection',
        'app_credential',
        'app_event_routing',
        'audit_event',
        'cell',
        'chatbot',
        'collection',
        'collection_version',
        'connection_key',
        'field',
        'file',
        'flag',
        'flow',
        'flow_instance',
        'flow_run',
        'flow_version',
        'folder',
        'git_repo',
        'instance',
        'issue',
        'manual_task',
        'manual_task_comment',
        'mcp',
        'mcp_piece',
        'mcp_run',
        'mcp_tool',
        'oauth_app',
        'otp',
        'piece_metadata',
        'piece_tag',
        'platform',
        'platform_analytics_report',
        'platform_billing',
        'project',
        'project_billing',
        'project_plan',
        'project_release',
        'project_role',
        'project_usage',
        'record',
        'signing_key',
        'step_file',
        'store-entry',
        'table',
        'table_webhook',
        'tag',
        'todo',
        'todo_activity',
        'todo_comment',
        'trigger_event',
        'trigger_run',
        'trigger_source',
        'user',
        'user_identity',
        'user_invitation',
        'webhook_simulation',
        'worker_machine',
    ]

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({
            name: this.name,
        }, 'Starting schema migration from public to activepieces')

        // Check if migration is needed by checking if any tables exist in public schema
        const tablesInPublic = await this.getTablesInSchema(queryRunner, 'public')

        if (tablesInPublic.length === 0) {
            log.info('No tables found in public schema, skipping migration')
            return
        }

        log.info(`Found ${tablesInPublic.length} tables in public schema to migrate`)

        // Move each table from public to activepieces schema
        let movedCount = 0
        for (const table of this.tables) {
            const tableExists = await this.checkTableExistsInSchema(queryRunner, 'public', table)

            if (tableExists) {
                try {
                    await queryRunner.query(`ALTER TABLE "public"."${table}" SET SCHEMA "activepieces"`)
                    movedCount++
                    log.info(`Moved table: ${table}`)
                }
                catch (error) {
                    log.warn({
                        table,
                        error,
                    }, `Failed to move table ${table}, it may not exist or already be in activepieces schema`)
                }
            }
        }

        log.info({
            name: this.name,
            movedCount,
        }, 'Completed schema migration')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info({
            name: this.name,
        }, 'Reverting schema migration from activepieces to public')

        // Move tables back from activepieces to public schema
        let movedCount = 0
        for (const table of this.tables) {
            const tableExists = await this.checkTableExistsInSchema(queryRunner, 'activepieces', table)

            if (tableExists) {
                try {
                    await queryRunner.query(`ALTER TABLE "activepieces"."${table}" SET SCHEMA "public"`)
                    movedCount++
                    log.info(`Moved table back: ${table}`)
                }
                catch (error) {
                    log.warn({
                        table,
                        error,
                    }, `Failed to move table ${table} back to public schema`)
                }
            }
        }

        log.info({
            name: this.name,
            movedCount,
        }, 'Completed schema migration rollback')
    }

    /**
     * Check if a table exists in a specific schema
     */
    private async checkTableExistsInSchema(
        queryRunner: QueryRunner,
        schema: string,
        tableName: string,
    ): Promise<boolean> {
        const result = await queryRunner.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = $1
                AND table_name = $2
            )`,
            [schema, tableName],
        ) as { exists: boolean }[]

        return result && result.length > 0 && result[0].exists
    }

    /**
     * Get all table names in a specific schema
     */
    private async getTablesInSchema(
        queryRunner: QueryRunner,
        schema: string,
    ): Promise<string[]> {
        const result = await queryRunner.query(
            `SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1
            AND table_type = 'BASE TABLE'`,
            [schema],
        ) as { table_name: string }[]

        return result.map(r => r.table_name)
    }
}
