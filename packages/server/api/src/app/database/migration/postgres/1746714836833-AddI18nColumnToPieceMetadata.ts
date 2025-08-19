import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddI18nColumnToPieceMetadata1746714836833 implements MigrationInterface {
    name = 'AddI18nColumnToPieceMetadata1746714836833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "i18n" json
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "i18n"
        `)
    }

}
