import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProjectVersionTable1734274305139 implements MigrationInterface {
    name = 'CreateProjectVersionTable1734274305139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_version" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying NOT NULL,
                "importedAt" character varying NOT NULL,
                "importedBy" character varying(21),
                "fileId" character varying NOT NULL,
                CONSTRAINT "PK_249c24f66d8f7e8ea6f9ff462fb" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_version_project_id" ON "project_version" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_version_imported_by" ON "project_version" ("importedBy")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_version_file_id" ON "project_version" ("fileId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_version"
            ADD CONSTRAINT "fk_project_version_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_version"
            ADD CONSTRAINT "fk_project_version_imported_by" FOREIGN KEY ("importedBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_version"
            ADD CONSTRAINT "fk_project_version_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_version" DROP CONSTRAINT "fk_project_version_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_version" DROP CONSTRAINT "fk_project_version_imported_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_version" DROP CONSTRAINT "fk_project_version_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_version_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_version_imported_by"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_version_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_version"
        `)
    }

}
