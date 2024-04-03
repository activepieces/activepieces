import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class addEventRouting1678382946390 implements MigrationInterface {
    name = 'addEventRouting1678382946390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration addEventRouting1678382946390')
        await queryRunner.query(
            'CREATE TABLE "app_event_routing" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "appName" character varying NOT NULL, "projectId" character varying(21) NOT NULL, "flowId" character varying(21) NOT NULL, "identifierValue" character varying NOT NULL, "event" character varying NOT NULL, CONSTRAINT "PK_2107df2b2faf9d50435f9d5acd7" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_app_event_routing_flow_id" ON "app_event_routing" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_event_project_id_appName_identifier_value_event" ON "app_event_routing" ("appName", "projectId", "identifierValue", "event") ',
        )
        logger.info('Finished migration addEventRouting1678382946390')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('Rolling Back migration addEventRouting1678382946390')
        await queryRunner.query(
            'DROP INDEX "public"."idx_app_event_project_id_appName_identifier_value_event"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."idx_app_event_routing_flow_id"',
        )
        await queryRunner.query('DROP TABLE "app_event_routing"')
        logger.info('Finished Rolling Back migration addEventRouting1678382946390')
    }
}
