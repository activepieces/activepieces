import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { insertScheduleFromFlowsMigration } from '../sqlite/1754477404726-AddTriggerSqlite'

export class AddTriggerSource1754478770608 implements MigrationInterface {
    name = 'AddTriggerSource1754478770608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "trigger_source" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" TIMESTAMP WITH TIME ZONE,
                "flowId" character varying NOT NULL,
                "flowVersionId" character varying NOT NULL,
                "handshakeConfiguration" jsonb,
                "projectId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "schedule" jsonb,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "simulate" boolean NOT NULL,
                CONSTRAINT "PK_aaccba5b6e8aa2f14f108504508" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await insertScheduleFromFlowsMigration(queryRunner, system.globalLogger())

        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "payloadFileId" character varying,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "error" character varying,
                "status" character varying NOT NULL,
                "triggerSourceId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "flowId" character varying(21),
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "PK_851d8c64cc2afc9b528c4473213" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "schedule"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "handshakeConfiguration"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_payload_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_trigger_source_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "handshakeConfiguration" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "schedule" jsonb
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_source"
        `)
    }

}
