import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMetadataFieldToFlowTemplates1744780800000 implements MigrationInterface {
    name = 'AddMetadataFieldToFlowTemplates1744780800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "metadata" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "metadata"
        `)
    }

}
