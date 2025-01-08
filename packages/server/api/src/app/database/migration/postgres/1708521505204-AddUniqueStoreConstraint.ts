import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddUniqueStoreConstraint1708521505204 implements MigrationInterface {
    name = 'AddUniqueStoreConstraint1708521505204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info(`${this.name} is up`)
        // Delete entries larger than 128 characters

        await queryRunner.query(`
            DELETE FROM "store-entry" AS se WHERE ("se"."projectId", "se"."key", "se"."created") NOT IN (SELECT "projectId", "key", MAX("created") FROM "store-entry" GROUP BY "projectId", "key");
        `)
        await queryRunner.query(`
             DELETE FROM "store-entry"
             WHERE LENGTH("key") > 128
         `)

        // Alter the column to change its type
        await queryRunner.query(`
            ALTER TABLE "store-entry"
            ALTER COLUMN "key" TYPE character varying(128) USING "key"::character varying(128)
        `)

        // Add constraints
        await queryRunner.query(`
            ALTER TABLE "store-entry"
            ADD CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d" UNIQUE ("projectId", "key")
        `)
        log.info(`${this.name} is finished`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints
        await queryRunner.query(`
            ALTER TABLE "store-entry" DROP CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d"
        `)

        // Alter the column to change its type back to the previous type
        await queryRunner.query(`
            ALTER TABLE "store-entry"
            ALTER COLUMN "key" TYPE character varying USING "key"::character varying
        `)
    }
}
