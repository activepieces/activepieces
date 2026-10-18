import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceTranslationTable1871000000000 implements Migration {
    name = 'AddPieceTranslationTable1871000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "piece_translation" (
                "pieceMetadataId" character varying(21) NOT NULL,
                "locale" character varying NOT NULL,
                "translations" jsonb NOT NULL,
                CONSTRAINT "pk_piece_translation" PRIMARY KEY ("pieceMetadataId", "locale"),
                CONSTRAINT "fk_piece_translation_piece_metadata_id" FOREIGN KEY ("pieceMetadataId") REFERENCES "piece_metadata"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "piece_translation"
        `)
    }
}
