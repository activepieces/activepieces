import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUiPreferencesToUserIdentity1810000000000 implements Migration {
    name = 'AddUiPreferencesToUserIdentity1810000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ADD "uiPreferences" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity" DROP COLUMN "uiPreferences"
        `)
    }
}
