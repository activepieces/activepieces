import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994 implements MigrationInterface {
    name = 'AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_record_table_id_project_id_record_id" ON "record" ("tableId", "projectId", "id")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_record_table_id_project_id_record_id"
        `)
    }

}
