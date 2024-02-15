import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStatusToConnectionsSqlite1693402376520
implements MigrationInterface {
    name = 'AddStatusToConnectionsSqlite1693402376520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (
            await migrationRan(
                'AddStatusToConnectionsSqlite31693402376520',
                queryRunner,
            )
        ) {
            return
        }
        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, "type" varchar NOT NULL, "status" varchar NOT NULL DEFAULT (\'ACTIVE\'), CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_app_connection"("id", "created", "updated", "name", "appName", "projectId", "value", "type") SELECT "id", "created", "updated", "name", "appName", "projectId", "value", "type" FROM "app_connection"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query(
            'ALTER TABLE "temporary_app_connection" RENAME TO "app_connection"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'ALTER TABLE "app_connection" RENAME TO "temporary_app_connection"',
        )
        await queryRunner.query(
            'CREATE TABLE "app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, "type" varchar NOT NULL, CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "app_connection"("id", "created", "updated", "name", "appName", "projectId", "value", "type") SELECT "id", "created", "updated", "name", "appName", "projectId", "value", "type" FROM "temporary_app_connection"',
        )
        await queryRunner.query('DROP TABLE "temporary_app_connection"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
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
