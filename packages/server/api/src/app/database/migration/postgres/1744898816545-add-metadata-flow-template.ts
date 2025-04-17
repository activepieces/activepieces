import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataFlowTemplate1744898816545 implements MigrationInterface {
    name = 'AddMetadataFlowTemplate1744898816545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "metadata" jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "metadata"
        `);
    }

}
