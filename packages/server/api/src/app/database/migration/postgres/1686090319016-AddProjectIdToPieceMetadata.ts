import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddProjectIdToPieceMetadata1686090319016
implements MigrationInterface {
    name = 'AddProjectIdToPieceMetadata1686090319016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddProjectIdToPieceMetadata1686090319016] up')
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "projectId" character varying',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        log.info('[AddProjectIdToPieceMetadata1686090319016] finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_project_id"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "projectId"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_version" ON "piece_metadata" ("name", "version") ',
        )
    }
}
