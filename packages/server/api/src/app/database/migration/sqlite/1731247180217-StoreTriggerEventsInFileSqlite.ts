import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class StoreTriggerEventsInFileSqlite1731247180217 implements MigrationInterface {
    name = 'StoreTriggerEventsInFileSqlite1731247180217'

    public async up(queryRunner: QueryRunner): Promise<void> {

        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_flow_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "sourceName" varchar NOT NULL,
                "fileId" varchar NOT NULL,
                CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_event_file_id" FOREIGN KEY ("fileId") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_event"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_event"
                RENAME TO "trigger_event"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
                RENAME TO "temporary_trigger_event"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "sourceName" varchar NOT NULL,
                "payload" text,
                CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_event"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `)
    }

}
