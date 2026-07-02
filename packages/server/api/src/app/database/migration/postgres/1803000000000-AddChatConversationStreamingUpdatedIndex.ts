import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddChatConversationStreamingUpdatedIndex1803000000000 implements Migration {
    name = 'AddChatConversationStreamingUpdatedIndex1803000000000'
    breaking = false
    release = '0.86.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
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
        if (isPGlite) {
            await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_conversation_streaming_updated"')
        }
        else {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "idx_chat_conversation_streaming_updated"')
        }
    }
}
