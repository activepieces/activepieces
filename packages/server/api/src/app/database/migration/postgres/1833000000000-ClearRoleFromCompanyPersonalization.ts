import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class ClearRoleFromCompanyPersonalization1833000000000 implements Migration {
    name = 'ClearRoleFromCompanyPersonalization1833000000000'
    breaking = false
    release = '0.88.2'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "chat_personalization"
            SET "role" = NULL
            WHERE "userId" IS NULL AND "role" IS NOT NULL
        `)
    }

    public async down(): Promise<void> {
        return
    }
}
