import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'
import { migrationHelpers } from '../../migration-helpers'

export class AddTableProjectIdExternalIdUniqueIndex1867000000000 implements Migration {
    name = 'AddTableProjectIdExternalIdUniqueIndex1867000000000'
    breaking = false
    release = '0.93.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "table"
            SET "externalId" = "id"
            WHERE "id" IN (
                SELECT "id" FROM (
                    SELECT "id",
                           ROW_NUMBER() OVER (
                               PARTITION BY "projectId", "externalId"
                               ORDER BY "created" DESC, "id" DESC
                           ) AS rn
                    FROM "table"
                ) ranked
                WHERE ranked.rn > 1
            )
        `)
        await migrationHelpers.createIndexConcurrently({
            queryRunner,
            name: 'idx_table_project_id_external_id',
            table: 'table',
            columns: '"projectId", "externalId"',
            unique: true,
        })
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await migrationHelpers.dropIndexConcurrently({
            queryRunner,
            name: 'idx_table_project_id_external_id',
        })
    }
}
