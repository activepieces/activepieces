import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFileToPostgres1693004806926 implements MigrationInterface {
    name = 'AddFileToPostgres1693004806926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "step_file" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "flowId" character varying(21) NOT NULL, "projectId" character varying(21) NOT NULL, "name" character varying NOT NULL, "size" integer NOT NULL, "stepName" character varying NOT NULL, "data" bytea NOT NULL, CONSTRAINT "PK_04bb9022ff8c2190fea2036174e" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step_file" ("projectId", "flowId", "stepName", "name") ',
        )
        await queryRunner.query(
            'ALTER TABLE "step_file" ADD CONSTRAINT "fk_step_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "step_file" ADD CONSTRAINT "fk_step_file_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "step_file" DROP CONSTRAINT "fk_step_file_flow_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "step_file" DROP CONSTRAINT "fk_step_file_project_id"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."step_file_project_id_flow_id_step_name_name"',
        )
        await queryRunner.query('DROP TABLE "step_file"')
    }
}
