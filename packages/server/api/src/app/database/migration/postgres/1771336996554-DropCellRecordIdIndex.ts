import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropCellRecordIdIndex1771336996554 implements MigrationInterface {
    name = 'DropCellRecordIdIndex1771336996554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_cell_record_id"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_cell_record_id" ON "cell" ("recordId")
        `)
    }

}
