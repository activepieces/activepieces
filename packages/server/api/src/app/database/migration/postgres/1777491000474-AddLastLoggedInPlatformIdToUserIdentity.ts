import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddLastLoggedInPlatformIdToUserIdentity1777491000474 implements Migration {
    name = 'AddLastLoggedInPlatformIdToUserIdentity1777491000474'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ADD "lastLoggedInPlatformId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity" DROP COLUMN "lastLoggedInPlatformId"
        `)
    }
}
