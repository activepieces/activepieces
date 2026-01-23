import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRecordIdToCellEntity1769136998805 implements MigrationInterface {
    name = 'AddRecordIdToCellEntity1769136998805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_cell_record_id" ON "cell" ("recordId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_cell_record_id"
        `)
    }

}
