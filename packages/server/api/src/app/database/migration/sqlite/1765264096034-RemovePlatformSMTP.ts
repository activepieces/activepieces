import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemovePlatformSMTP1765264096034 implements MigrationInterface {
    name = 'RemovePlatformSMTP1765264096034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_platform" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "primaryColor" varchar NOT NULL,
                "logoIconUrl" varchar NOT NULL,
                "fullLogoUrl" varchar NOT NULL,
                "favIconUrl" varchar NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "pinnedPieces" text NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_platform"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "name",
                    "primaryColor",
                    "logoIconUrl",
                    "fullLogoUrl",
                    "favIconUrl",
                    "cloudAuthEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "pinnedPieces"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "name",
                "primaryColor",
                "logoIconUrl",
                "fullLogoUrl",
                "favIconUrl",
                "cloudAuthEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "pinnedPieces"
            FROM "platform"
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_platform"
                RENAME TO "platform"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id_and_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME TO "temporary_platform"
        `)
        await queryRunner.query(`
            CREATE TABLE "platform" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "primaryColor" varchar NOT NULL,
                "logoIconUrl" varchar NOT NULL,
                "fullLogoUrl" varchar NOT NULL,
                "favIconUrl" varchar NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "smtp" text,
                "pinnedPieces" text NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "platform"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "name",
                    "primaryColor",
                    "logoIconUrl",
                    "fullLogoUrl",
                    "favIconUrl",
                    "cloudAuthEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "pinnedPieces"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "name",
                "primaryColor",
                "logoIconUrl",
                "fullLogoUrl",
                "favIconUrl",
                "cloudAuthEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "pinnedPieces"
            FROM "temporary_platform"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `)
    }

}
