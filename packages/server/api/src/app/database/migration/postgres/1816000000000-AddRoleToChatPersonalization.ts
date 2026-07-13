import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddRoleToChatPersonalization1816000000000 implements Migration {
    name = 'AddRoleToChatPersonalization1816000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_personalization" ADD COLUMN "role" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_personalization" DROP COLUMN IF EXISTS "role"
        `)
    }
}
