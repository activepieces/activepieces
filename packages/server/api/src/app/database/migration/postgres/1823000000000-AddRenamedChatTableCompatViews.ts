import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

const RENAMED_TABLES: [oldName: string, newName: string][] = [
    ['chat_conversation', 'agent_conversation'],
    ['user_chat_memory', 'user_memory'],
]

export class AddRenamedChatTableCompatViews1823000000000 implements Migration {
    name = 'AddRenamedChatTableCompatViews1823000000000'
    breaking = false
    release = '0.87.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const [oldName, newName] of RENAMED_TABLES) {
            await queryRunner.query(`CREATE OR REPLACE VIEW "${oldName}" AS SELECT * FROM "${newName}"`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const [oldName] of RENAMED_TABLES) {
            await queryRunner.query(`DROP VIEW IF EXISTS "${oldName}"`)
        }
    }
}
