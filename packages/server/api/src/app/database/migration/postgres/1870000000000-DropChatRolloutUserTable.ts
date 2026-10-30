import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropChatRolloutUserTable1870000000000 implements Migration {
    name = 'DropChatRolloutUserTable1870000000000'
    breaking = true
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_rollout_user" CASCADE
        `)
    }

    public async down(): Promise<void> {
        return
    }
}
