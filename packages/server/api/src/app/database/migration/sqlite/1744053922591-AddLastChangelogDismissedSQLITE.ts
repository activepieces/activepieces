import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastChangelogDismissedSQLITE1744053922591 implements MigrationInterface {
    name = 'AddLastChangelogDismissedSQLITE1744053922591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                "lastChangelogDismissed" datetime,
                CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "status",
                    "externalId",
                    "platformId",
                    "platformRole",
                    "identityId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "externalId",
                "platformId",
                "platformRole",
                "identityId"
            FROM "user"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "status",
                    "externalId",
                    "platformId",
                    "platformRole",
                    "identityId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "externalId",
                "platformId",
                "platformRole",
                "identityId"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
    }

}
