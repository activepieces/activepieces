import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '@activepieces/server-shared'

// Didn't use getOrThrow here because if we decide to remove this value from AppSystemProp in the future, using getOrThrow would break this migration.
const MAX_CONCURRENT_JOBS_PER_PROJECT = system.getNumber(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) ?? 100

export class AddMaximumConcurrentJobsPerProject1761245180906 implements MigrationInterface {
    name = 'AddMaximumConcurrentJobsPerProject1761245180906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "maxConcurrentJobs" integer
        `)

        await queryRunner.query(`
            UPDATE "project" SET "maxConcurrentJobs" = $1
        `, [MAX_CONCURRENT_JOBS_PER_PROJECT])

        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "maxConcurrentJobs" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "maxConcurrentJobs"
        `)
    }

}
