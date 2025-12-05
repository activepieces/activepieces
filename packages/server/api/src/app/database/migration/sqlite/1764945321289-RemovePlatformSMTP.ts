import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemovePlatformSMTP1764945321289 implements MigrationInterface {
    name = 'RemovePlatformSMTP1764945321289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
        await queryRunner.query(`
            CREATE TABLE "project_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "pieces" text NOT NULL,
                "locked" boolean NOT NULL DEFAULT (0),
                "piecesFilterType" varchar NOT NULL,
                "aiCredits" integer,
                CONSTRAINT "REL_4f52e89612966d95843e4158bb" UNIQUE ("projectId")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_plan_project_id" ON "project_plan" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "custom_domain" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "domain" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ACTIVE', 'PENDING')) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `)
        await queryRunner.query(`
            CREATE TABLE "signing_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "publicKey" varchar NOT NULL,
                "algorithm" varchar CHECK("algorithm" IN ('RSA')) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "oauth_app" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "clientId" varchar NOT NULL,
                "clientSecret" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platformId_pieceName" ON "oauth_app" ("platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE TABLE "otp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "type" varchar CHECK(
                    "type" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
                ) NOT NULL,
                "identityId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                "state" varchar CHECK("state" IN ('PENDING', 'CONFIRMED')) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
        `)
        await queryRunner.query(`
            CREATE TABLE "api_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "hashedValue" varchar NOT NULL,
                "truncatedValue" varchar NOT NULL,
                "lastUsedAt" varchar
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_template" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "description" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "template" text NOT NULL,
                "tags" varchar array NOT NULL,
                "pieces" varchar array NOT NULL,
                "blogUrl" varchar,
                "metadata" text
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `)
        await queryRunner.query(`
            CREATE TABLE "git_repo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "remoteUrl" varchar NOT NULL,
                "branch" varchar NOT NULL,
                "branchType" varchar NOT NULL DEFAULT ('DEVELOPMENT'),
                "sshPrivateKey" varchar,
                "slug" varchar NOT NULL,
                CONSTRAINT "REL_5b59d96420074128fc1d269b9c" UNIQUE ("projectId")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_git_repo_project_id" ON "git_repo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "audit_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "action" varchar NOT NULL,
                "userEmail" varchar,
                "projectDisplayName" varchar,
                "data" text NOT NULL,
                "ip" varchar,
                "userId" varchar
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
        `)
        await queryRunner.query(`
            CREATE TABLE "project_release" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "importedBy" varchar(21),
                "fileId" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('GIT', 'PROJECT', 'ROLLBACK')) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_release_project_id" ON "project_release" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "totalFlows" integer NOT NULL,
                "activeFlows" integer NOT NULL,
                "totalUsers" integer NOT NULL,
                "activeUsers" integer NOT NULL,
                "totalProjects" integer NOT NULL,
                "activeProjects" integer NOT NULL,
                "uniquePiecesUsed" integer NOT NULL,
                "activeFlowsWithAI" integer NOT NULL,
                "topPieces" text NOT NULL,
                "topProjects" text NOT NULL,
                "runsUsage" text NOT NULL,
                CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "appsumo" (
                "uuid" varchar PRIMARY KEY NOT NULL,
                "plan_id" varchar NOT NULL,
                "activation_email" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "connection_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_connection_key_project_id" ON "connection_key" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "app_credential" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "appName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "plan" varchar,
                "includedAiCredits" integer NOT NULL,
                "aiCreditsOverageLimit" integer,
                "aiCreditsOverageState" varchar,
                "stripeSubscriptionStartDate" integer,
                "stripeSubscriptionEndDate" integer,
                "stripeSubscriptionCancelDate" integer,
                "environmentsEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "showPoweredBy" boolean NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "teamProjectsLimit" varchar NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "stripeCustomerId" varchar,
                "stripeSubscriptionId" varchar,
                "stripeSubscriptionStatus" varchar,
                "tablesEnabled" boolean NOT NULL,
                "todosEnabled" boolean NOT NULL,
                "projectsLimit" integer,
                "agentsEnabled" boolean NOT NULL,
                "activeFlowsLimit" integer,
                "mcpsEnabled" boolean NOT NULL,
                "dedicatedWorkers" text
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_plan_platform_id" ON "platform_plan" ("platformId")
        `)
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
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL,
                CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project_member"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "platformId",
                    "userId",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "platformId",
                "userId",
                "projectRoleId"
            FROM "project_member"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project_member"
                RENAME TO "project_member"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_plan_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "pieces" text NOT NULL,
                "locked" boolean NOT NULL DEFAULT (0),
                "piecesFilterType" varchar NOT NULL,
                "aiCredits" integer,
                CONSTRAINT "REL_4f52e89612966d95843e4158bb" UNIQUE ("projectId"),
                CONSTRAINT "fk_project_plan_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project_plan"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "name",
                    "pieces",
                    "locked",
                    "piecesFilterType",
                    "aiCredits"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "name",
                "pieces",
                "locked",
                "piecesFilterType",
                "aiCredits"
            FROM "project_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "project_plan"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project_plan"
                RENAME TO "project_plan"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_plan_project_id" ON "project_plan" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "custom_domain_domain_unique"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_custom_domain" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "domain" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ACTIVE', 'PENDING')) NOT NULL,
                CONSTRAINT "fk_custom_domain_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_custom_domain"(
                    "id",
                    "created",
                    "updated",
                    "domain",
                    "platformId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "domain",
                "platformId",
                "status"
            FROM "custom_domain"
        `)
        await queryRunner.query(`
            DROP TABLE "custom_domain"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_custom_domain"
                RENAME TO "custom_domain"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_signing_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "publicKey" varchar NOT NULL,
                "algorithm" varchar CHECK("algorithm" IN ('RSA')) NOT NULL,
                CONSTRAINT "fk_signing_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_signing_key"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "platformId",
                    "publicKey",
                    "algorithm"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "platformId",
                "publicKey",
                "algorithm"
            FROM "signing_key"
        `)
        await queryRunner.query(`
            DROP TABLE "signing_key"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_signing_key"
                RENAME TO "signing_key"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_oauth_app_platformId_pieceName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_oauth_app" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "clientId" varchar NOT NULL,
                "clientSecret" text NOT NULL,
                CONSTRAINT "fk_oauth_app_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_oauth_app"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "platformId",
                    "clientId",
                    "clientSecret"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "platformId",
                "clientId",
                "clientSecret"
            FROM "oauth_app"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_app"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_oauth_app"
                RENAME TO "oauth_app"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platformId_pieceName" ON "oauth_app" ("platformId", "pieceName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_otp_identity_id_type"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_otp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "type" varchar CHECK(
                    "type" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
                ) NOT NULL,
                "identityId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                "state" varchar CHECK("state" IN ('PENDING', 'CONFIRMED')) NOT NULL,
                CONSTRAINT "fk_otp_identity_id" FOREIGN KEY ("identityId") REFERENCES "user_identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_otp"(
                    "id",
                    "created",
                    "updated",
                    "type",
                    "identityId",
                    "value",
                    "state"
                )
            SELECT "id",
                "created",
                "updated",
                "type",
                "identityId",
                "value",
                "state"
            FROM "otp"
        `)
        await queryRunner.query(`
            DROP TABLE "otp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_otp"
                RENAME TO "otp"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_api_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "hashedValue" varchar NOT NULL,
                "truncatedValue" varchar NOT NULL,
                "lastUsedAt" varchar,
                CONSTRAINT "fk_api_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_api_key"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "platformId",
                    "hashedValue",
                    "truncatedValue",
                    "lastUsedAt"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "platformId",
                "hashedValue",
                "truncatedValue",
                "lastUsedAt"
            FROM "api_key"
        `)
        await queryRunner.query(`
            DROP TABLE "api_key"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_api_key"
                RENAME TO "api_key"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_template" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "description" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "template" text NOT NULL,
                "tags" varchar array NOT NULL,
                "pieces" varchar array NOT NULL,
                "blogUrl" varchar,
                "metadata" text,
                CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow_template"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "description",
                    "type",
                    "platformId",
                    "projectId",
                    "template",
                    "tags",
                    "pieces",
                    "blogUrl",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "description",
                "type",
                "platformId",
                "projectId",
                "template",
                "tags",
                "pieces",
                "blogUrl",
                "metadata"
            FROM "flow_template"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_template"
                RENAME TO "flow_template"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_git_repo_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_git_repo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "remoteUrl" varchar NOT NULL,
                "branch" varchar NOT NULL,
                "branchType" varchar NOT NULL DEFAULT ('DEVELOPMENT'),
                "sshPrivateKey" varchar,
                "slug" varchar NOT NULL,
                CONSTRAINT "REL_5b59d96420074128fc1d269b9c" UNIQUE ("projectId"),
                CONSTRAINT "fk_git_repo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_git_repo"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "remoteUrl",
                    "branch",
                    "branchType",
                    "sshPrivateKey",
                    "slug"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "remoteUrl",
                "branch",
                "branchType",
                "sshPrivateKey",
                "slug"
            FROM "git_repo"
        `)
        await queryRunner.query(`
            DROP TABLE "git_repo"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_git_repo"
                RENAME TO "git_repo"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_git_repo_project_id" ON "git_repo" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_action_idx"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_audit_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "action" varchar NOT NULL,
                "userEmail" varchar,
                "projectDisplayName" varchar,
                "data" text NOT NULL,
                "ip" varchar,
                "userId" varchar,
                CONSTRAINT "FK_8188cdbf5c16c58d431efddd451" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_audit_event"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "projectId",
                    "action",
                    "userEmail",
                    "projectDisplayName",
                    "data",
                    "ip",
                    "userId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "projectId",
                "action",
                "userEmail",
                "projectDisplayName",
                "data",
                "ip",
                "userId"
            FROM "audit_event"
        `)
        await queryRunner.query(`
            DROP TABLE "audit_event"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_audit_event"
                RENAME TO "audit_event"
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_release_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project_release" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "importedBy" varchar(21),
                "fileId" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('GIT', 'PROJECT', 'ROLLBACK')) NOT NULL,
                CONSTRAINT "fk_project_release_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_release_imported_by" FOREIGN KEY ("importedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_project_release_file_id" FOREIGN KEY ("fileId") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project_release"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "name",
                    "description",
                    "importedBy",
                    "fileId",
                    "type"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "name",
                "description",
                "importedBy",
                "fileId",
                "type"
            FROM "project_release"
        `)
        await queryRunner.query(`
            DROP TABLE "project_release"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project_release"
                RENAME TO "project_release"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_release_project_id" ON "project_release" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_platform_analytics_report" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "totalFlows" integer NOT NULL,
                "activeFlows" integer NOT NULL,
                "totalUsers" integer NOT NULL,
                "activeUsers" integer NOT NULL,
                "totalProjects" integer NOT NULL,
                "activeProjects" integer NOT NULL,
                "uniquePiecesUsed" integer NOT NULL,
                "activeFlowsWithAI" integer NOT NULL,
                "topPieces" text NOT NULL,
                "topProjects" text NOT NULL,
                "runsUsage" text NOT NULL,
                CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId"),
                CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_platform_analytics_report"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "totalFlows",
                    "activeFlows",
                    "totalUsers",
                    "activeUsers",
                    "totalProjects",
                    "activeProjects",
                    "uniquePiecesUsed",
                    "activeFlowsWithAI",
                    "topPieces",
                    "topProjects",
                    "runsUsage"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "totalFlows",
                "activeFlows",
                "totalUsers",
                "activeUsers",
                "totalProjects",
                "activeProjects",
                "uniquePiecesUsed",
                "activeFlowsWithAI",
                "topPieces",
                "topProjects",
                "runsUsage"
            FROM "platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_platform_analytics_report"
                RENAME TO "platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_connection_key_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_connection_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL,
                CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_connection_key"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "settings"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "settings"
            FROM "connection_key"
        `)
        await queryRunner.query(`
            DROP TABLE "connection_key"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_connection_key"
                RENAME TO "connection_key"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_connection_key_project_id" ON "connection_key" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_credential" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "appName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL,
                CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_app_credential"(
                    "id",
                    "created",
                    "updated",
                    "appName",
                    "projectId",
                    "settings"
                )
            SELECT "id",
                "created",
                "updated",
                "appName",
                "projectId",
                "settings"
            FROM "app_credential"
        `)
        await queryRunner.query(`
            DROP TABLE "app_credential"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_app_credential"
                RENAME TO "app_credential"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_plan_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_platform_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "plan" varchar,
                "includedAiCredits" integer NOT NULL,
                "aiCreditsOverageLimit" integer,
                "aiCreditsOverageState" varchar,
                "stripeSubscriptionStartDate" integer,
                "stripeSubscriptionEndDate" integer,
                "stripeSubscriptionCancelDate" integer,
                "environmentsEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "showPoweredBy" boolean NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "teamProjectsLimit" varchar NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "stripeCustomerId" varchar,
                "stripeSubscriptionId" varchar,
                "stripeSubscriptionStatus" varchar,
                "tablesEnabled" boolean NOT NULL,
                "todosEnabled" boolean NOT NULL,
                "projectsLimit" integer,
                "agentsEnabled" boolean NOT NULL,
                "activeFlowsLimit" integer,
                "mcpsEnabled" boolean NOT NULL,
                "dedicatedWorkers" text,
                CONSTRAINT "fk_platform_plan_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_platform_plan"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "plan",
                    "includedAiCredits",
                    "aiCreditsOverageLimit",
                    "aiCreditsOverageState",
                    "stripeSubscriptionStartDate",
                    "stripeSubscriptionEndDate",
                    "stripeSubscriptionCancelDate",
                    "environmentsEnabled",
                    "analyticsEnabled",
                    "showPoweredBy",
                    "auditLogEnabled",
                    "embeddingEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "customAppearanceEnabled",
                    "teamProjectsLimit",
                    "projectRolesEnabled",
                    "customDomainsEnabled",
                    "globalConnectionsEnabled",
                    "customRolesEnabled",
                    "apiKeysEnabled",
                    "ssoEnabled",
                    "licenseKey",
                    "stripeCustomerId",
                    "stripeSubscriptionId",
                    "stripeSubscriptionStatus",
                    "tablesEnabled",
                    "todosEnabled",
                    "projectsLimit",
                    "agentsEnabled",
                    "activeFlowsLimit",
                    "mcpsEnabled",
                    "dedicatedWorkers"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "plan",
                "includedAiCredits",
                "aiCreditsOverageLimit",
                "aiCreditsOverageState",
                "stripeSubscriptionStartDate",
                "stripeSubscriptionEndDate",
                "stripeSubscriptionCancelDate",
                "environmentsEnabled",
                "analyticsEnabled",
                "showPoweredBy",
                "auditLogEnabled",
                "embeddingEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "customAppearanceEnabled",
                "teamProjectsLimit",
                "projectRolesEnabled",
                "customDomainsEnabled",
                "globalConnectionsEnabled",
                "customRolesEnabled",
                "apiKeysEnabled",
                "ssoEnabled",
                "licenseKey",
                "stripeCustomerId",
                "stripeSubscriptionId",
                "stripeSubscriptionStatus",
                "tablesEnabled",
                "todosEnabled",
                "projectsLimit",
                "agentsEnabled",
                "activeFlowsLimit",
                "mcpsEnabled",
                "dedicatedWorkers"
            FROM "platform_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_plan"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_platform_plan"
                RENAME TO "platform_plan"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_plan_platform_id" ON "platform_plan" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_platform_plan_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME TO "temporary_platform_plan"
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "plan" varchar,
                "includedAiCredits" integer NOT NULL,
                "aiCreditsOverageLimit" integer,
                "aiCreditsOverageState" varchar,
                "stripeSubscriptionStartDate" integer,
                "stripeSubscriptionEndDate" integer,
                "stripeSubscriptionCancelDate" integer,
                "environmentsEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "showPoweredBy" boolean NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "teamProjectsLimit" varchar NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "stripeCustomerId" varchar,
                "stripeSubscriptionId" varchar,
                "stripeSubscriptionStatus" varchar,
                "tablesEnabled" boolean NOT NULL,
                "todosEnabled" boolean NOT NULL,
                "projectsLimit" integer,
                "agentsEnabled" boolean NOT NULL,
                "activeFlowsLimit" integer,
                "mcpsEnabled" boolean NOT NULL,
                "dedicatedWorkers" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "platform_plan"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "plan",
                    "includedAiCredits",
                    "aiCreditsOverageLimit",
                    "aiCreditsOverageState",
                    "stripeSubscriptionStartDate",
                    "stripeSubscriptionEndDate",
                    "stripeSubscriptionCancelDate",
                    "environmentsEnabled",
                    "analyticsEnabled",
                    "showPoweredBy",
                    "auditLogEnabled",
                    "embeddingEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "customAppearanceEnabled",
                    "teamProjectsLimit",
                    "projectRolesEnabled",
                    "customDomainsEnabled",
                    "globalConnectionsEnabled",
                    "customRolesEnabled",
                    "apiKeysEnabled",
                    "ssoEnabled",
                    "licenseKey",
                    "stripeCustomerId",
                    "stripeSubscriptionId",
                    "stripeSubscriptionStatus",
                    "tablesEnabled",
                    "todosEnabled",
                    "projectsLimit",
                    "agentsEnabled",
                    "activeFlowsLimit",
                    "mcpsEnabled",
                    "dedicatedWorkers"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "plan",
                "includedAiCredits",
                "aiCreditsOverageLimit",
                "aiCreditsOverageState",
                "stripeSubscriptionStartDate",
                "stripeSubscriptionEndDate",
                "stripeSubscriptionCancelDate",
                "environmentsEnabled",
                "analyticsEnabled",
                "showPoweredBy",
                "auditLogEnabled",
                "embeddingEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "customAppearanceEnabled",
                "teamProjectsLimit",
                "projectRolesEnabled",
                "customDomainsEnabled",
                "globalConnectionsEnabled",
                "customRolesEnabled",
                "apiKeysEnabled",
                "ssoEnabled",
                "licenseKey",
                "stripeCustomerId",
                "stripeSubscriptionId",
                "stripeSubscriptionStatus",
                "tablesEnabled",
                "todosEnabled",
                "projectsLimit",
                "agentsEnabled",
                "activeFlowsLimit",
                "mcpsEnabled",
                "dedicatedWorkers"
            FROM "temporary_platform_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform_plan"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_plan_platform_id" ON "platform_plan" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential"
                RENAME TO "temporary_app_credential"
        `)
        await queryRunner.query(`
            CREATE TABLE "app_credential" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "appName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "app_credential"(
                    "id",
                    "created",
                    "updated",
                    "appName",
                    "projectId",
                    "settings"
                )
            SELECT "id",
                "created",
                "updated",
                "appName",
                "projectId",
                "settings"
            FROM "temporary_app_credential"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_credential"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_connection_key_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
                RENAME TO "temporary_connection_key"
        `)
        await queryRunner.query(`
            CREATE TABLE "connection_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "settings" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "connection_key"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "settings"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "settings"
            FROM "temporary_connection_key"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_connection_key"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_connection_key_project_id" ON "connection_key" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
                RENAME TO "temporary_platform_analytics_report"
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "totalFlows" integer NOT NULL,
                "activeFlows" integer NOT NULL,
                "totalUsers" integer NOT NULL,
                "activeUsers" integer NOT NULL,
                "totalProjects" integer NOT NULL,
                "activeProjects" integer NOT NULL,
                "uniquePiecesUsed" integer NOT NULL,
                "activeFlowsWithAI" integer NOT NULL,
                "topPieces" text NOT NULL,
                "topProjects" text NOT NULL,
                "runsUsage" text NOT NULL,
                CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "platform_analytics_report"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "totalFlows",
                    "activeFlows",
                    "totalUsers",
                    "activeUsers",
                    "totalProjects",
                    "activeProjects",
                    "uniquePiecesUsed",
                    "activeFlowsWithAI",
                    "topPieces",
                    "topProjects",
                    "runsUsage"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "totalFlows",
                "activeFlows",
                "totalUsers",
                "activeUsers",
                "totalProjects",
                "activeProjects",
                "uniquePiecesUsed",
                "activeFlowsWithAI",
                "topPieces",
                "topProjects",
                "runsUsage"
            FROM "temporary_platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_release_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
                RENAME TO "temporary_project_release"
        `)
        await queryRunner.query(`
            CREATE TABLE "project_release" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "importedBy" varchar(21),
                "fileId" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('GIT', 'PROJECT', 'ROLLBACK')) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project_release"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "name",
                    "description",
                    "importedBy",
                    "fileId",
                    "type"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "name",
                "description",
                "importedBy",
                "fileId",
                "type"
            FROM "temporary_project_release"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project_release"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_release_project_id" ON "project_release" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
                RENAME TO "temporary_audit_event"
        `)
        await queryRunner.query(`
            CREATE TABLE "audit_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "action" varchar NOT NULL,
                "userEmail" varchar,
                "projectDisplayName" varchar,
                "data" text NOT NULL,
                "ip" varchar,
                "userId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "audit_event"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "projectId",
                    "action",
                    "userEmail",
                    "projectDisplayName",
                    "data",
                    "ip",
                    "userId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "projectId",
                "action",
                "userEmail",
                "projectDisplayName",
                "data",
                "ip",
                "userId"
            FROM "temporary_audit_event"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_audit_event"
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_git_repo_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo"
                RENAME TO "temporary_git_repo"
        `)
        await queryRunner.query(`
            CREATE TABLE "git_repo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "remoteUrl" varchar NOT NULL,
                "branch" varchar NOT NULL,
                "branchType" varchar NOT NULL DEFAULT ('DEVELOPMENT'),
                "sshPrivateKey" varchar,
                "slug" varchar NOT NULL,
                CONSTRAINT "REL_5b59d96420074128fc1d269b9c" UNIQUE ("projectId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "git_repo"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "remoteUrl",
                    "branch",
                    "branchType",
                    "sshPrivateKey",
                    "slug"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "remoteUrl",
                "branch",
                "branchType",
                "sshPrivateKey",
                "slug"
            FROM "temporary_git_repo"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_git_repo"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_git_repo_project_id" ON "git_repo" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
                RENAME TO "temporary_flow_template"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_template" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "description" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "template" text NOT NULL,
                "tags" varchar array NOT NULL,
                "pieces" varchar array NOT NULL,
                "blogUrl" varchar,
                "metadata" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow_template"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "description",
                    "type",
                    "platformId",
                    "projectId",
                    "template",
                    "tags",
                    "pieces",
                    "blogUrl",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "description",
                "type",
                "platformId",
                "projectId",
                "template",
                "tags",
                "pieces",
                "blogUrl",
                "metadata"
            FROM "temporary_flow_template"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_template"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `)
        await queryRunner.query(`
            ALTER TABLE "api_key"
                RENAME TO "temporary_api_key"
        `)
        await queryRunner.query(`
            CREATE TABLE "api_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "hashedValue" varchar NOT NULL,
                "truncatedValue" varchar NOT NULL,
                "lastUsedAt" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "api_key"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "platformId",
                    "hashedValue",
                    "truncatedValue",
                    "lastUsedAt"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "platformId",
                "hashedValue",
                "truncatedValue",
                "lastUsedAt"
            FROM "temporary_api_key"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_api_key"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_otp_identity_id_type"
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
                RENAME TO "temporary_otp"
        `)
        await queryRunner.query(`
            CREATE TABLE "otp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "type" varchar CHECK(
                    "type" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
                ) NOT NULL,
                "identityId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                "state" varchar CHECK("state" IN ('PENDING', 'CONFIRMED')) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "otp"(
                    "id",
                    "created",
                    "updated",
                    "type",
                    "identityId",
                    "value",
                    "state"
                )
            SELECT "id",
                "created",
                "updated",
                "type",
                "identityId",
                "value",
                "state"
            FROM "temporary_otp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_otp"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_oauth_app_platformId_pieceName"
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_app"
                RENAME TO "temporary_oauth_app"
        `)
        await queryRunner.query(`
            CREATE TABLE "oauth_app" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "clientId" varchar NOT NULL,
                "clientSecret" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "oauth_app"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "platformId",
                    "clientId",
                    "clientSecret"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "platformId",
                "clientId",
                "clientSecret"
            FROM "temporary_oauth_app"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_oauth_app"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platformId_pieceName" ON "oauth_app" ("platformId", "pieceName")
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
                RENAME TO "temporary_signing_key"
        `)
        await queryRunner.query(`
            CREATE TABLE "signing_key" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "publicKey" varchar NOT NULL,
                "algorithm" varchar CHECK("algorithm" IN ('RSA')) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "signing_key"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "platformId",
                    "publicKey",
                    "algorithm"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "platformId",
                "publicKey",
                "algorithm"
            FROM "temporary_signing_key"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_signing_key"
        `)
        await queryRunner.query(`
            DROP INDEX "custom_domain_domain_unique"
        `)
        await queryRunner.query(`
            ALTER TABLE "custom_domain"
                RENAME TO "temporary_custom_domain"
        `)
        await queryRunner.query(`
            CREATE TABLE "custom_domain" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "domain" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ACTIVE', 'PENDING')) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "custom_domain"(
                    "id",
                    "created",
                    "updated",
                    "domain",
                    "platformId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "domain",
                "platformId",
                "status"
            FROM "temporary_custom_domain"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_custom_domain"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_plan_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
                RENAME TO "temporary_project_plan"
        `)
        await queryRunner.query(`
            CREATE TABLE "project_plan" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "pieces" text NOT NULL,
                "locked" boolean NOT NULL DEFAULT (0),
                "piecesFilterType" varchar NOT NULL,
                "aiCredits" integer,
                CONSTRAINT "REL_4f52e89612966d95843e4158bb" UNIQUE ("projectId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project_plan"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "name",
                    "pieces",
                    "locked",
                    "piecesFilterType",
                    "aiCredits"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "name",
                "pieces",
                "locked",
                "piecesFilterType",
                "aiCredits"
            FROM "temporary_project_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project_plan"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_plan_project_id" ON "project_plan" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
                RENAME TO "temporary_project_member"
        `)
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project_member"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "platformId",
                    "userId",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "platformId",
                "userId",
                "projectRoleId"
            FROM "temporary_project_member"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project_member"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
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
        await queryRunner.query(`
            DROP INDEX "idx_platform_plan_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "app_credential"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_connection_key_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "connection_key"
        `)
        await queryRunner.query(`
            DROP TABLE "appsumo"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_release_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_release"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP TABLE "audit_event"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_git_repo_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "git_repo"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `)
        await queryRunner.query(`
            DROP TABLE "api_key"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_otp_identity_id_type"
        `)
        await queryRunner.query(`
            DROP TABLE "otp"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_oauth_app_platformId_pieceName"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_app"
        `)
        await queryRunner.query(`
            DROP TABLE "signing_key"
        `)
        await queryRunner.query(`
            DROP INDEX "custom_domain_domain_unique"
        `)
        await queryRunner.query(`
            DROP TABLE "custom_domain"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_plan_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_plan"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
    }

}
