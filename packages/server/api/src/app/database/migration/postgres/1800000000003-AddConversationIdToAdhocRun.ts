import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddConversationIdToAdhocRun1800000000003 implements Migration {
    name = 'AddConversationIdToAdhocRun1800000000003'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" ADD "conversationId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_adhoc_run_conversation_id" ON "adhoc_run" ("conversationId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_adhoc_run_conversation_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" DROP COLUMN "conversationId"
        `)
    }
}
