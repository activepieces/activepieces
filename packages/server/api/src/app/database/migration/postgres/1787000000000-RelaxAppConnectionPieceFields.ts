import { MigrationInterface, QueryRunner } from 'typeorm'

export class RelaxAppConnectionPieceFields1787000000000 implements MigrationInterface {
    name = 'RelaxAppConnectionPieceFields1787000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceName" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "pieceVersion" = '0.0.0'
            WHERE "pieceVersion" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" SET NOT NULL
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "pieceName" = '@activepieces/piece-no-piece'
            WHERE "pieceName" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceName" SET NOT NULL
        `)
    }
}
