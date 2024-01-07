import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGitSyncEnabledToPlatform1704636362533 implements MigrationInterface {
    name = 'AddGitSyncEnabledToPlatform1704636362533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "gitSyncEnabled" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "gitSyncEnabled" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "gitSyncEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "gitSyncEnabled"
        `)
    }

}
