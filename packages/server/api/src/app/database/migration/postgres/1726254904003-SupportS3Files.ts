import { logger } from "@activepieces/server-shared";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SupportS3Files1726254904003 implements MigrationInterface {
    name = 'SupportS3Files1726254904003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "aiTokens"
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "location" character varying
        `);
        await queryRunner.query(`
            UPDATE "file"
            SET "location" = 'DB'
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "location" SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "s3Key" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "data" DROP NOT NULL
        `);
        logger.info({
            name: this.name,
        }, 'is up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "data"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "s3Key"
        `);
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "location"
        `);
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "aiTokens" integer DEFAULT '1000'
        `);
        logger.info({
            name: this.name,
        }, 'is down')
    }

}
