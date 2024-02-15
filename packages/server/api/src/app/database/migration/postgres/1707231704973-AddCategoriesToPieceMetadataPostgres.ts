import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCategoriesToPieceMetadataPostgres1707231704973
implements MigrationInterface {
    name = 'AddCategoriesToPieceMetadataPostgres1707231704973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "categories" character varying array
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "categories"
        `)
    }
}
