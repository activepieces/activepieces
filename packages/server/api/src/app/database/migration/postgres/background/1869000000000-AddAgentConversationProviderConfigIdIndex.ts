import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from '../../../background-migration'
import { migrationHelpers } from '../../../migration-helpers'

export class AddAgentConversationProviderConfigIdIndex1869000000000 implements BackgroundMigration {
    name = 'AddAgentConversationProviderConfigIdIndex1869000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        await migrationHelpers.createIndexConcurrently({
            queryRunner,
            name: 'idx_agent_conversation_platform_provider_config',
            table: 'agent_conversation',
            columns: '"platformId", "providerConfigId"',
            where: '"providerConfigId" IS NOT NULL',
        })
    }

    public async down(): Promise<void> {
        return
    }
}
