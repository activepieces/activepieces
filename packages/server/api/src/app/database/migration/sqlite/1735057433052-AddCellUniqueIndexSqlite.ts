import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCellUniqueIndex1735057433052 implements MigrationInterface {
    name = 'AddCellUniqueIndex1735057433052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
    }

}
