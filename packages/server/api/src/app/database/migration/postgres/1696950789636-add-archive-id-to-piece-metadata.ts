import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddArchiveIdToPieceMetadata1696950789636
implements MigrationInterface {
    name = 'AddArchiveIdToPieceMetadata1696950789636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "archiveId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "UQ_b43d7b070f0fc309932d4cf0165" UNIQUE ("archiveId")
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)

        log.info('AddArchiveIdToPieceMetadata1696950789636 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_file"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "UQ_b43d7b070f0fc309932d4cf0165"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "archiveId"
        `)

        log.info('AddArchiveIdToPieceMetadata1696950789636 down')
    }
}
