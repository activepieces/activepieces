import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdForTablesAndFields1746356907629 implements MigrationInterface {
    name = 'AddExternalIdForTablesAndFields1746356907629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD "externalId" character varying
        `)
        
        const tables = await queryRunner.query(`
            SELECT * FROM "table"
        `)
        for (const table of tables) {
            const externalId = apId()
            await queryRunner.query(`
                UPDATE "table"
                SET "externalId" = '${externalId}'
                WHERE id = '${table.id}'
            `)
        }

        await queryRunner.query(`
            ALTER TABLE "table"
            ALTER COLUMN "externalId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "externalId" character varying
        `)
        
        const fields = await queryRunner.query(`
            SELECT * FROM "field"
        `)
        for (const field of fields) {
            const externalId = apId()
            await queryRunner.query(`
                UPDATE "field"
                SET "externalId" = '${externalId}'
                WHERE id = '${field.id}'
            `)
        }

        await queryRunner.query(`
            ALTER TABLE "field"
            ALTER COLUMN "externalId" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "externalId"
        `)
    }

}
