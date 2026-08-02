import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

async function renameConstraint(queryRunner: QueryRunner, table: string, from: string, to: string): Promise<void> {
    await queryRunner.query(`
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${from}') THEN
                ALTER TABLE "${table}" RENAME CONSTRAINT "${from}" TO "${to}";
            END IF;
        END $$;
    `)
}

async function renameIndex(queryRunner: QueryRunner, from: string, to: string): Promise<void> {
    await queryRunner.query(`ALTER INDEX IF EXISTS "${from}" RENAME TO "${to}"`)
}

async function renameTable(queryRunner: QueryRunner, from: string, to: string): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "${from}" RENAME TO "${to}"`)
}

export class RenameChatTablesToAgent1819000000000 implements Migration {
    name = 'RenameChatTablesToAgent1819000000000'
    breaking = false
    release = '0.86.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await renameConstraint(queryRunner, 'chat_conversation', 'pk_chat_conversation', 'pk_agent_conversation')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_chat_conversation_platform_id', 'fk_agent_conversation_platform_id')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_chat_conversation_project_id', 'fk_agent_conversation_project_id')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_chat_conversation_user_id', 'fk_agent_conversation_user_id')
        await renameConstraint(queryRunner, 'user_chat_memory', 'PK_user_chat_memory', 'PK_user_memory')
        await renameConstraint(queryRunner, 'user_chat_memory', 'fk_user_chat_memory_platform_id', 'fk_user_memory_platform_id')
        await renameConstraint(queryRunner, 'user_chat_memory', 'fk_user_chat_memory_user_id', 'fk_user_memory_user_id')

        await renameIndex(queryRunner, 'idx_chat_conversation_platform_user_created_id', 'idx_agent_conversation_platform_user_created_id')
        await renameIndex(queryRunner, 'idx_chat_conversation_streaming_updated', 'idx_agent_conversation_streaming_updated')
        await renameIndex(queryRunner, 'idx_user_chat_memory_platform_user', 'idx_user_memory_platform_user')

        await renameTable(queryRunner, 'chat_conversation', 'agent_conversation')
        await renameTable(queryRunner, 'user_chat_memory', 'user_memory')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await renameTable(queryRunner, 'agent_conversation', 'chat_conversation')
        await renameTable(queryRunner, 'user_memory', 'user_chat_memory')

        await renameIndex(queryRunner, 'idx_agent_conversation_platform_user_created_id', 'idx_chat_conversation_platform_user_created_id')
        await renameIndex(queryRunner, 'idx_agent_conversation_streaming_updated', 'idx_chat_conversation_streaming_updated')
        await renameIndex(queryRunner, 'idx_user_memory_platform_user', 'idx_user_chat_memory_platform_user')

        await renameConstraint(queryRunner, 'chat_conversation', 'pk_agent_conversation', 'pk_chat_conversation')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_agent_conversation_platform_id', 'fk_chat_conversation_platform_id')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_agent_conversation_project_id', 'fk_chat_conversation_project_id')
        await renameConstraint(queryRunner, 'chat_conversation', 'fk_agent_conversation_user_id', 'fk_chat_conversation_user_id')
        await renameConstraint(queryRunner, 'user_chat_memory', 'PK_user_memory', 'PK_user_chat_memory')
        await renameConstraint(queryRunner, 'user_chat_memory', 'fk_user_memory_platform_id', 'fk_user_chat_memory_platform_id')
        await renameConstraint(queryRunner, 'user_chat_memory', 'fk_user_memory_user_id', 'fk_user_chat_memory_user_id')
    }
}
