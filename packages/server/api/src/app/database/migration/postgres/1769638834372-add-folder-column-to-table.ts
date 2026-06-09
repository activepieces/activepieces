import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFolderColumnToTable1769638834372 implements MigrationInterface {
    name = 'AddFolderColumnToTable1769638834372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD "folderId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "folderId"
        `)
    }

}
