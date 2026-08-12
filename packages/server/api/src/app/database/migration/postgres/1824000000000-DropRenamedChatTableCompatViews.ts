import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

const COMPAT_VIEWS: [viewName: string, backedBy: string][] = [
    ['chat_conversation', 'agent_conversation'],
    ['user_chat_memory', 'user_memory'],
]

export class DropRenamedChatTableCompatViews1824000000000 implements Migration {
    name = 'DropRenamedChatTableCompatViews1824000000000'
    breaking = false
    release = '0.88.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const [viewName] of COMPAT_VIEWS) {
            await queryRunner.query(`DROP VIEW IF EXISTS "${viewName}"`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const [viewName, backedBy] of COMPAT_VIEWS) {
            await queryRunner.query(`CREATE OR REPLACE VIEW "${viewName}" AS SELECT * FROM "${backedBy}"`)
        }
    }
}
