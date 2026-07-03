import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

// Plain (non-CONCURRENT) index build: chat_conversation is small and the partial predicate
// keeps the build subsecond, while CONCURRENTLY would run outside a transaction and stall on
// concurrent snapshots — which desyncs parallel migration runners (CI runs suites in parallel
// against one database) and risks committed-DDL/rolled-back-bookkeeping divergence.
export class AddChatConversationStreamingUpdatedIndex1804000000000 implements Migration {
    name = 'AddChatConversationStreamingUpdatedIndex1804000000000'
    breaking = false
    release = '0.86.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_chat_conversation_streaming_updated"
            ON "chat_conversation" ("updated")
            WHERE "status" = 'STREAMING'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_conversation_streaming_updated"')
    }
}
