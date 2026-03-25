import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class SupportS3Files1726364421096 implements MigrationInterface {
    name = 'SupportS3Files1726364421096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "location" character varying
        `)
        await queryRunner.query(`
            UPDATE "file"
            SET "location" = 'DB'
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "location" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "fileName" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "size" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "metadata" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "s3Key" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "data" DROP NOT NULL
        `)
        log.info({
            name: this.name,
        }, 'is up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "file"
            WHERE "type" = 'FLOW_STEP_FILE'
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
            ALTER COLUMN "data"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "s3Key"
        `)
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "size"
        `)
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "fileName"
        `)
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "location"
        `)
        log.info({
            name: this.name,
        }, 'is down')
    }

}
