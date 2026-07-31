import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

// Split out of CreatePieceSetTable1807000000000 so that migration can run in a transaction:
// CREATE INDEX CONCURRENTLY is illegal inside a transaction block, so this one must stay
// autocommit (transaction = false). It indexes project.pieceSetId, added by 1807.
export class AddProjectPieceSetIdIndex1808000000000 implements Migration {
    name = 'AddProjectPieceSetIdIndex1808000000000'
    breaking = false
    release = '0.103.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_project_piece_set_id"
                ON "project" ("pieceSetId")
            `)
        }
        else {
            // CONCURRENTLY avoids a ShareLock that would block all writes on the
            // existing "project" table for the duration of the index build.
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_project_piece_set_id"
                ON "project" ("pieceSetId")
            `)
        }
    }

    // No CONCURRENTLY here: TypeORM always wraps down() in a transaction, and concurrent
    // index drops are illegal inside one.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_project_piece_set_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
