import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepFileSqlite31692958076906 implements MigrationInterface {
    name = 'AddStepFileSqlite31692958076906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "step-file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL)')
        await queryRunner.query('CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step-file" ("projectId", "flowId", "stepName", "name") ')
        await queryRunner.query('DROP INDEX "step_file_project_id_flow_id_step_name_name"')
        await queryRunner.query('CREATE TABLE "temporary_step-file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL, CONSTRAINT "fk_step_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_step_file_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)')
        await queryRunner.query('INSERT INTO "temporary_step-file"("id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data") SELECT "id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data" FROM "step-file"')
        await queryRunner.query('DROP TABLE "step-file"')
        await queryRunner.query('ALTER TABLE "temporary_step-file" RENAME TO "step-file"')
        await queryRunner.query('CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step-file" ("projectId", "flowId", "stepName", "name") ')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "step_file_project_id_flow_id_step_name_name"')
        await queryRunner.query('ALTER TABLE "step-file" RENAME TO "temporary_step-file"')
        await queryRunner.query('CREATE TABLE "step-file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL)')
        await queryRunner.query('INSERT INTO "step-file"("id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data") SELECT "id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data" FROM "temporary_step-file"')
        await queryRunner.query('DROP TABLE "temporary_step-file"')
        await queryRunner.query('CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step-file" ("projectId", "flowId", "stepName", "name") ')
        await queryRunner.query('DROP INDEX "step_file_project_id_flow_id_step_name_name"')
        await queryRunner.query('DROP TABLE "step-file"')
    }

}
