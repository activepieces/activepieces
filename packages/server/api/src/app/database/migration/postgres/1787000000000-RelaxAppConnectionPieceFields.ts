import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class RelaxAppConnectionPieceFields1787000000000 implements Migration {
    name = 'RelaxAppConnectionPieceFields1787000000000'
    breaking = false
    release = '0.83.0'

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
            DELETE FROM "app_connection"
            WHERE "pieceName" IS NULL OR "pieceVersion" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceName" SET NOT NULL
        `)
    }
}
