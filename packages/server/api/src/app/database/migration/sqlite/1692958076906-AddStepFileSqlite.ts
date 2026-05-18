import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepFileSqlite1692958076906 implements MigrationInterface {
    name = 'AddStepFileSqlite1692958076906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await migrationRan('AddStepFileSqlite31692958076906', queryRunner)) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "step_file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL)',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step_file" ("projectId", "flowId", "stepName", "name") ',
        )
        await queryRunner.query(
            'DROP INDEX "step_file_project_id_flow_id_step_name_name"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_step_file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL, CONSTRAINT "fk_step_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_step_file_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_step_file"("id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data") SELECT "id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data" FROM "step_file"',
        )
        await queryRunner.query('DROP TABLE "step_file"')
        await queryRunner.query(
            'ALTER TABLE "temporary_step_file" RENAME TO "step_file"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step_file" ("projectId", "flowId", "stepName", "name") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "step_file_project_id_flow_id_step_name_name"',
        )
        await queryRunner.query(
            'ALTER TABLE "step_file" RENAME TO "temporary_step_file"',
        )
        await queryRunner.query(
            'CREATE TABLE "step_file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "name" varchar NOT NULL, "size" integer NOT NULL, "stepName" varchar NOT NULL, "data" blob NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "step_file"("id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data") SELECT "id", "created", "updated", "flowId", "projectId", "name", "size", "stepName", "data" FROM "temporary_step_file"',
        )
        await queryRunner.query('DROP TABLE "temporary_step_file"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "step_file_project_id_flow_id_step_name_name" ON "step_file" ("projectId", "flowId", "stepName", "name") ',
        )
        await queryRunner.query(
            'DROP INDEX "step_file_project_id_flow_id_step_name_name"',
        )
        await queryRunner.query('DROP TABLE "step_file"')
    }
}

async function migrationRan(
    migration: string,
    queryRunner: QueryRunner,
): Promise<boolean> {
    const result = await queryRunner.query(
        'SELECT * from migrations where name = ?',
        [migration],
    )
    return result.length > 0
}
