import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentRunSource1819000000000 implements Migration {
    name = 'AddAgentRunSource1819000000000'
    breaking = false
    release = '0.87.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD "source" character varying
        `)
        await queryRunner.query(`
            UPDATE "chat_conversation" SET "source" = 'CHAT' WHERE "source" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" ALTER COLUMN "source" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" DROP COLUMN "source"
        `)
    }
}
