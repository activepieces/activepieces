import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTablesIntoTemplateEntity1768306510367 implements MigrationInterface {
    name = 'AddTablesIntoTemplateEntity1768306510367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "tables" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "template"
            ALTER COLUMN "flows" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ALTER COLUMN "flows"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "tables"
        `)
    }

}
