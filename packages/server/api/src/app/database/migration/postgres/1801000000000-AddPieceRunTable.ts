import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceRunTable1801000000000 implements Migration {
    name = 'AddPieceRunTable1801000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "piece_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "actionName" character varying NOT NULL,
                "connectionExternalId" character varying,
                "input" jsonb NOT NULL,
                "output" jsonb,
                "status" character varying NOT NULL,
                "errorMessage" character varying,
                "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "finishTime" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_piece_run" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_created" ON "piece_run" ("projectId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_piece_run_project_id_piece_name_created" ON "piece_run" ("projectId", "pieceName", "created")
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_run"
            ADD CONSTRAINT "fk_piece_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_run" DROP CONSTRAINT "fk_piece_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_piece_name_created"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_run_project_id_created"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_run"
        `)
    }
}
