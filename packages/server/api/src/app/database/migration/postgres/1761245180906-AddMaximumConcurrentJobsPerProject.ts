import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMaximumConcurrentJobsPerProject1761245180906 implements MigrationInterface {
    name = 'AddMaximumConcurrentJobsPerProject1761245180906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "maxConcurrentJobs" integer NOT NULL DEFAULT '100'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "maxConcurrentJobs"
        `)
    }

}
