import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

// Partial index over STREAMING rows only — backs the CHAT_STALE_SWEEP recovery query.
export class AddChatConversationStreamingUpdatedIndex1810000000000 implements Migration {
    name = 'AddChatConversationStreamingUpdatedIndex1810000000000'
    breaking = false
    release = '0.86.2'
    // CONCURRENTLY (non-PGlite) is illegal inside a transaction.
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_chat_conversation_streaming_updated"
                ON "chat_conversation" ("updated")
                WHERE "status" = 'STREAMING'
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_conversation_streaming_updated"
                ON "chat_conversation" ("updated")
                WHERE "status" = 'STREAMING'
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_conversation_streaming_updated"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
