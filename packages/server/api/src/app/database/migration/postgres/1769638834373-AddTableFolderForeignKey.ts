import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTableFolderForeignKey1769638834373 implements MigrationInterface {
    name = 'AddTableFolderForeignKey1769638834373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "table" SET "folderId" = NULL
            WHERE "folderId" IS NOT NULL
            AND "folderId" NOT IN (SELECT "id" FROM "folder")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_folder_id" ON "table" ("folderId")
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_folder_id"
            FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_table_folder_id"
        `)
    }
}
