import { MigrationInterface, QueryRunner } from 'typeorm'
import { insertScheduleFromFlowsMigration } from '../sqlite/1754358230010-SeperateTriggerFromFlowsSqlite'

export class SeperateTriggerFromFlows1754359587873 implements MigrationInterface {
    name = 'SeperateTriggerFromFlows1754359587873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "trigger" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowId" character varying NOT NULL,
                "flowVersionId" character varying NOT NULL,
                "handshakeConfiguration" jsonb,
                "projectId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "schedule" jsonb,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "simulate" boolean NOT NULL,
                CONSTRAINT "PK_fc6b3cbbe199d89c002831e03e8" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4dca296d76b8094e00758480c7" ON "trigger" ("projectId", "flowId", "simulate")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3b34c13cddb1ca1fffec7e9a82" ON "trigger" ("flowId", "simulate")
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger"
            ADD CONSTRAINT "FK_fa9abec1f54b7aecadbbc01ea25" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger"
            ADD CONSTRAINT "FK_07f4cfe174cec5caa4430e7b614" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await insertScheduleFromFlowsMigration(queryRunner)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "schedule"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "handshakeConfiguration"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger" DROP CONSTRAINT "FK_07f4cfe174cec5caa4430e7b614"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger" DROP CONSTRAINT "FK_fa9abec1f54b7aecadbbc01ea25"
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
            DROP INDEX "public"."IDX_3b34c13cddb1ca1fffec7e9a82"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4dca296d76b8094e00758480c7"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger"
        `)
    }

}
