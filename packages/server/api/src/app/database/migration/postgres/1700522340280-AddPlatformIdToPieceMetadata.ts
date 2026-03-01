import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformIdToPieceMetadata1700522340280
implements MigrationInterface {
    name = 'AddPlatformIdToPieceMetadata1700522340280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "platformId" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "platformId"
        `)
    }
}
