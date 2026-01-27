import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTemplateIdToFlowEntity1768829135202 implements MigrationInterface {
    name = 'AddTemplateIdToFlowEntity1768829135202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "templateId" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "templateId"
        `)
    }

}
