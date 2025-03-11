import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecordOrderColumn1741696200187 implements MigrationInterface {
    name = 'AddRecordOrderColumn1741696200187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD "order" integer NOT NULL DEFAULT '0'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id_order" ON "record" ("projectId", "tableId", "order")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_record_project_id_table_id_order"
        `);
        await queryRunner.query(`
            ALTER TABLE "record" DROP COLUMN "order"
        `);
    }

}
