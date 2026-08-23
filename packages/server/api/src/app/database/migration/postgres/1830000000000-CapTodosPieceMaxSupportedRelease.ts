import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class CapTodosPieceMaxSupportedRelease1830000000000 implements Migration {
    name = 'CapTodosPieceMaxSupportedRelease1830000000000'
    breaking = false
    release = '0.89.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "piece_metadata"
            SET "maximumSupportedRelease" = '0.78.2'
            WHERE "name" = '@activepieces/piece-todos'
            AND "pieceType" = 'OFFICIAL'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "piece_metadata"
            SET "maximumSupportedRelease" = '99999.99999.9999'
            WHERE "name" = '@activepieces/piece-todos'
            AND "pieceType" = 'OFFICIAL'
        `)
    }
}
