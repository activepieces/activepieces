import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddProviderConfigIdToAgentConversation1868000000000 implements Migration {
    name = 'AddProviderConfigIdToAgentConversation1868000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD "providerConfigId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation" DROP COLUMN "providerConfigId"
        `)
    }
}
