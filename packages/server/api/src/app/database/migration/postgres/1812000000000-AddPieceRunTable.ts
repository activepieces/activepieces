import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceRunTable1812000000000 implements Migration {
    name = 'AddPieceRunTable1812000000000'
    breaking = false
    release = '0.86.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "piece_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21),
                "conversationId" character varying(21),
                "kind" character varying NOT NULL,
                "pieceName" character varying,
                "pieceVersion" character varying,
                "actionName" character varying,
                "connectionExternalId" character varying,
                "source" character varying NOT NULL,
                "status" character varying NOT NULL,
                "input" jsonb,
                "output" jsonb,
                "logs" text,
                "errorMessage" text,
                "startTime" TIMESTAMP WITH TIME ZONE,
                "finishTime" TIMESTAMP WITH TIME ZONE,
                "logsFileId" character varying(21),
                "archivedAt" character varying,
                CONSTRAINT "PK_piece_run" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_created_archived_at" ON "piece_run" ("projectId", "created", "archivedAt")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_status_created" ON "piece_run" ("projectId", "status", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_source_created" ON "piece_run" ("projectId", "source", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_user_id_created" ON "piece_run" ("projectId", "userId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_piece_name_created" ON "piece_run" ("projectId", "pieceName", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_conversation_id" ON "piece_run" ("conversationId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_created" ON "piece_run" ("created")
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run"
            ADD CONSTRAINT "fk_piece_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run"
            ADD CONSTRAINT "fk_piece_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run"
            ADD CONSTRAINT "fk_piece_run_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_run" DROP CONSTRAINT "fk_piece_run_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run" DROP CONSTRAINT "fk_piece_run_logs_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run" DROP CONSTRAINT "fk_piece_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_conversation_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_piece_name_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_user_id_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_source_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_status_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_created_archived_at"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_run"
        `)
    }
}
