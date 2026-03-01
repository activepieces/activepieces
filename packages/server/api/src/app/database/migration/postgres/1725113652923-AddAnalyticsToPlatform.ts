import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAnalyticsToPlatform1725113652923 implements MigrationInterface {
    name = 'AddAnalyticsToPlatform1725113652923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "analyticsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "analyticsEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "analyticsEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "analyticsEnabled"
        `)
    }

}
