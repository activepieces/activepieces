import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddConcurrencyPoolTable1775800000000 implements Migration {
    name = 'AddConcurrencyPoolTable1775800000000'
    breaking = false
    release = '0.82.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "concurrency_pool" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                "updated" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "key" character varying NOT NULL,
                "maxConcurrentJobs" integer NOT NULL,
                CONSTRAINT "pk_concurrency_pool" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query('CREATE UNIQUE INDEX "idx_concurrency_pool_platform_key" ON "concurrency_pool" ("platformId", "key")')
        await queryRunner.query('ALTER TABLE "project" ADD "poolId" character varying(21)')
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_pool_id"
            FOREIGN KEY ("poolId") REFERENCES "concurrency_pool"("id")
            ON DELETE SET NULL
        `)
        if (isPGlite) {
            await queryRunner.query('CREATE INDEX "idx_project_pool_id" ON "project" ("poolId")')
        }
        else {
            await queryRunner.query('CREATE INDEX CONCURRENTLY "idx_project_pool_id" ON "project" ("poolId")')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query('DROP INDEX "idx_project_pool_id"')
        }
        else {
            await queryRunner.query('DROP INDEX CONCURRENTLY "idx_project_pool_id"')
        }
        await queryRunner.query('ALTER TABLE "project" DROP CONSTRAINT "fk_project_pool_id"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN "poolId"')
        await queryRunner.query('DROP INDEX "idx_concurrency_pool_platform_key"')
        await queryRunner.query('DROP TABLE "concurrency_pool"')
    }
}
