import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastLoggedInPlatformIdToUserIdentity1777491000474 implements MigrationInterface {
    name = 'AddLastLoggedInPlatformIdToUserIdentity1777491000474'

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
