import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecordIndexForTableIdAndProjectIdAndRecordId1744136707296 implements MigrationInterface {
    name = 'AddRecordIndexForTableIdAndProjectIdAndRecordId1744136707296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_record_created" ON "record" ("created")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_record_table_id_project_id_record_id"
        `);
    }

}
