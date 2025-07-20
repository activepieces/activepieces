import { MigrationInterface, QueryRunner } from 'typeorm'

export class RestrictPieces1739546878775 implements MigrationInterface {
    name = 'RestrictPieces1739546878775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_file"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP CONSTRAINT "fk_piece_metadata_file"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
