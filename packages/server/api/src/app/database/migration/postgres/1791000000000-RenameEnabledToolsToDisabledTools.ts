import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

const ALL_CONTROLLABLE_TOOL_NAMES = [
    'ap_build_flow',
    'ap_create_flow',
    'ap_duplicate_flow',
    'ap_rename_flow',
    'ap_update_trigger',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_add_branch',
    'ap_update_branch',
    'ap_delete_branch',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_delete_flow',
    'ap_manage_notes',
    'ap_create_table',
    'ap_delete_table',
    'ap_manage_fields',
    'ap_insert_records',
    'ap_update_record',
    'ap_delete_records',
    'ap_test_flow',
    'ap_test_step',
    'ap_retry_run',
    'ap_run_action',
]

export class RenameEnabledToolsToDisabledTools1791000000000 implements Migration {
    name = 'RenameEnabledToolsToDisabledTools1791000000000'
    breaking = false
    release = '0.82.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD COLUMN "disabledTools" jsonb
        `)

        const allToolsJson = JSON.stringify(ALL_CONTROLLABLE_TOOL_NAMES)

        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "disabledTools" = COALESCE(
                (
                    SELECT jsonb_agg(tool)
                    FROM jsonb_array_elements_text($1::jsonb) AS tool
                    WHERE tool NOT IN (
                        SELECT jsonb_array_elements_text("enabledTools")
                    )
                ),
                '[]'::jsonb
            )
            WHERE "enabledTools" IS NOT NULL
        `, [allToolsJson])

        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "disabledTools" = '[]'::jsonb
            WHERE "enabledTools" IS NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            DROP COLUMN "enabledTools"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD COLUMN "enabledTools" jsonb
        `)

        const allToolsJson = JSON.stringify(ALL_CONTROLLABLE_TOOL_NAMES)

        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "enabledTools" = COALESCE(
                (
                    SELECT jsonb_agg(tool)
                    FROM jsonb_array_elements_text($1::jsonb) AS tool
                    WHERE tool NOT IN (
                        SELECT jsonb_array_elements_text("disabledTools")
                    )
                ),
                '[]'::jsonb
            )
            WHERE "disabledTools" IS NOT NULL
        `, [allToolsJson])

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            DROP COLUMN "disabledTools"
        `)
    }
}
