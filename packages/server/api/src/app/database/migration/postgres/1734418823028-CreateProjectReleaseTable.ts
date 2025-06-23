import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProjectReleaseTable1734418823028 implements MigrationInterface {
    name = 'CreateProjectReleaseTable1734418823028'

    public async up(queryRunner: QueryRunner): Promise<void> {
 
        await queryRunner.query(`
            CREATE TABLE "project_release" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "importedBy" character varying(21),
                "fileId" character varying NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_11aa4566a8a7a623e5c3f9809fe" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_release_project_id" ON "project_release" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_imported_by" FOREIGN KEY ("importedBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_imported_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_release_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_release"
        `)
    }

}
