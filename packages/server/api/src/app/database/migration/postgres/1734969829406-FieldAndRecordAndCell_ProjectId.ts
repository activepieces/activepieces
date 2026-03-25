import { MigrationInterface, QueryRunner } from 'typeorm'

export class FieldAndRecordAndCellProjectId1734969829406 implements MigrationInterface {
    name = 'FieldAndRecordAndCellProjectId1734969829406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_field_table_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "projectId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD "projectId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD "projectId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "record" DROP CONSTRAINT "fk_record_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "fk_field_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "cell" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "record" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_table_id_name" ON "field" ("name", "tableId")
        `)
    }

}
