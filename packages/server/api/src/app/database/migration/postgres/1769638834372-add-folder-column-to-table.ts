import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFolderColumnToTable1769638834372 implements MigrationInterface {
    name = 'AddFolderColumnToTable1769638834372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD "folderId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_cell_record_id" ON "cell" ("recordId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_cell_record_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "folderId"
        `)
    }

}
