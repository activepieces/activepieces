import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class addtriggerevents1678621361185 implements MigrationInterface {
    name = 'addtriggerevents1678621361185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('addtriggerevents1678621361185 up: started')
        await queryRunner.query(
            'CREATE TABLE "trigger_event" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "flowId" character varying(21) NOT NULL, "projectId" character varying(21) NOT NULL, "sourceName" character varying NOT NULL, "payload" jsonb NOT NULL, CONSTRAINT "PK_79bbc8c2af95776e801c7eaab11" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "trigger_event" ADD CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "trigger_event" ADD CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        log.info('addtriggerevents1678621361185 up: finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_flow_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "trigger_event" DROP CONSTRAINT "fk_trigger_event_project_id"',
        )
        await queryRunner.query('DROP INDEX "idx_trigger_event_flow_id"')
        await queryRunner.query('DROP TABLE "trigger_event"')
    }
}
