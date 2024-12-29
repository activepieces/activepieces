import { MigrationInterface, QueryRunner } from 'typeorm'

export class FieldPositionIndex1735494267431 implements MigrationInterface {
    name = 'FieldPositionIndex1735494267431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "UQ_92bf9f4f184be9b4d0f93f48b48"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_field_project_id_table_id_position" ON "field" ("projectId", "tableId", "position")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_field_project_id_table_id_position"
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "UQ_92bf9f4f184be9b4d0f93f48b48" UNIQUE ("position")
        `)
    }

}
