import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUsageCountFromTemplates1768738475196 implements MigrationInterface {
    name = 'RemoveUsageCountFromTemplates1768738475196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "usageCount"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "usageCount" integer NOT NULL DEFAULT 0
        `)
    }

}
