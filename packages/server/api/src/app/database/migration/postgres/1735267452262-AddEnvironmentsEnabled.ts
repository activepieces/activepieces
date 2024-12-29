import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEnvironmentsEnabled1735267452262 implements MigrationInterface {
    name = 'AddEnvironmentsEnabled1735267452262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME COLUMN "gitSyncEnabled" TO "environmentsEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "releasesEnabled" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "releasesEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME COLUMN "environmentsEnabled" TO "gitSyncEnabled"
        `)
    }

}
