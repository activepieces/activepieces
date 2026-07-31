import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

// Piece sets (CreatePieceSetTable1807000000000) replace the old platform-level piece filters.
// Dropping the columns is breaking, so it is its own transactional migration and runs last —
// after the piece_set backfill and the project.pieceSetId index build. The columns are created
// on every edition (CreateDefaultPlatform / AddPlatformToPostgres), so they are dropped on every
// edition too.
export class DropPlatformPieceFilters1809000000000 implements Migration {
    name = 'DropPlatformPieceFilters1809000000000'
    breaking = true
    release = '0.103.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                DROP COLUMN IF EXISTS "filteredPieceNames",
                DROP COLUMN IF EXISTS "filteredPieceBehavior"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                ADD COLUMN IF NOT EXISTS "filteredPieceNames" character varying array NOT NULL DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS "filteredPieceBehavior" character varying NOT NULL DEFAULT 'BLOCKED'
        `)
    }
}
