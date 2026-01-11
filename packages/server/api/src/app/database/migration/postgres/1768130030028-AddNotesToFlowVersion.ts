import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesToFlowVersion1768130030028 implements MigrationInterface {
    name = 'AddNotesToFlowVersion1768130030028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "notes" jsonb NOT NULL
            DEFAULT '[]'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "notes"
        `);
    }

}
