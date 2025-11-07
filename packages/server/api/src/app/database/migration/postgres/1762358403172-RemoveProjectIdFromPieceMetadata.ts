import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveProjectIdFromPieceMetadata1762358403172 implements MigrationInterface {
    name = 'RemoveProjectIdFromPieceMetadata1762358403172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_piece_metadata_name_project_id_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_platform_id_version" ON "piece_metadata" ("name", "version", "platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_piece_metadata_name_platform_id_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId")
        `)
    }

}
