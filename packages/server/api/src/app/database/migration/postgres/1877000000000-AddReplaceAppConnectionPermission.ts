import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddReplaceAppConnectionPermission1877000000000 implements Migration {
    name = 'AddReplaceAppConnectionPermission1877000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "project_role"
            SET "permissions" = array_append("permissions", 'REPLACE_APP_CONNECTION')
            WHERE 'WRITE_APP_CONNECTION' = ANY("permissions")
            AND NOT 'REPLACE_APP_CONNECTION' = ANY("permissions")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "project_role"
            SET "permissions" = array_remove("permissions", 'REPLACE_APP_CONNECTION')
        `)
    }
}
