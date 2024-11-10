import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class StoreTriggerEventsInFile1731247581852 implements MigrationInterface {
    name = 'StoreTriggerEventsInFile1731247581852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            TRUNCATE TABLE "trigger_event"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
                RENAME COLUMN "payload" TO "fileId"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP COLUMN "fileId"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD "fileId" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD CONSTRAINT "fk_trigger_event_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event" DROP COLUMN "fileId"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
            ADD "fileId" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
                RENAME COLUMN "fileId" TO "payload"
        `)
    }

}
