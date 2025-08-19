import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFolderDisplayOrder1747062679388 implements MigrationInterface {
    name = 'AddFolderDisplayOrder1747062679388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_folder" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "displayOrder" integer NOT NULL DEFAULT (0),
                CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId"
            FROM "folder"
        `)
        await queryRunner.query(`
            DROP TABLE "folder"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_folder"
                RENAME TO "folder"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "folder"
                RENAME TO "temporary_folder"
        `)
        await queryRunner.query(`
            CREATE TABLE "folder" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId"
            FROM "temporary_folder"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_folder"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
    }

}
