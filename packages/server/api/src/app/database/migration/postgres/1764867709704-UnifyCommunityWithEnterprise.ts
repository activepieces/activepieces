import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class UnifyCommunityWithEnterprise1764867709704 implements MigrationInterface {
    name = 'UnifyCommunityWithEnterprise1764867709704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.COMMUNITY])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_plan_stripe_customer_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_credentials_projectId_appName"
        `)
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "projectRoleId" character varying(21) NOT NULL,
                CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
        await queryRunner.query(`
            CREATE TABLE "custom_domain" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "domain" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_76b2cc5a1514eeffc66184c922a" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `)
        await queryRunner.query(`
            CREATE TABLE "signing_key" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "publicKey" character varying NOT NULL,
                "algorithm" character varying NOT NULL,
                CONSTRAINT "PK_5cc161da020c79bb3ac9953edae" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "oauth_app" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "pieceName" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "clientId" character varying NOT NULL,
                "clientSecret" jsonb NOT NULL,
                CONSTRAINT "PK_3256b97c0a3ee2d67240805dca4" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platformId_pieceName" ON "oauth_app" ("platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE TABLE "otp" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "type" character varying NOT NULL,
                "identityId" character varying(21) NOT NULL,
                "value" character varying NOT NULL,
                "state" character varying NOT NULL,
                CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
        `)
        await queryRunner.query(`
            CREATE TABLE "api_key" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "hashedValue" character varying NOT NULL,
                "truncatedValue" character varying NOT NULL,
                "lastUsedAt" character varying,
                CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_template" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "type" character varying NOT NULL,
                "platformId" character varying NOT NULL,
                "projectId" character varying,
                "template" jsonb NOT NULL,
                "tags" character varying array NOT NULL,
                "pieces" character varying array NOT NULL,
                "blogUrl" character varying,
                "metadata" jsonb,
                CONSTRAINT "PK_fcacbf8776a0a3337eb8eca7478" PRIMARY KEY ("id")
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
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "remoteUrl" character varying NOT NULL,
                "branch" character varying NOT NULL,
                "branchType" character varying NOT NULL DEFAULT 'DEVELOPMENT',
                "sshPrivateKey" character varying,
                "slug" character varying NOT NULL,
                CONSTRAINT "REL_5b59d96420074128fc1d269b9c" UNIQUE ("projectId"),
                CONSTRAINT "PK_de881ac6eac39e4d9ba7c5ed3e6" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_git_repo_project_id" ON "git_repo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "audit_event" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "projectId" character varying,
                "action" character varying NOT NULL,
                "userEmail" character varying,
                "projectDisplayName" character varying,
                "data" jsonb NOT NULL,
                "ip" character varying,
                "userId" character varying,
                CONSTRAINT "PK_481efbe8b0a403efe3f47a6528f" PRIMARY KEY ("id")
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
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "importedBy" character varying(21),
                "fileId" character varying NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_11aa4566a8a7a623e5c3f9809fe" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_release_project_id" ON "project_release" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "totalFlows" integer NOT NULL,
                "activeFlows" integer NOT NULL,
                "totalUsers" integer NOT NULL,
                "activeUsers" integer NOT NULL,
                "totalProjects" integer NOT NULL,
                "activeProjects" integer NOT NULL,
                "uniquePiecesUsed" integer NOT NULL,
                "activeFlowsWithAI" integer NOT NULL,
                "topPieces" jsonb NOT NULL,
                "topProjects" jsonb NOT NULL,
                "runsUsage" jsonb NOT NULL,
                CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId"),
                CONSTRAINT "PK_8b060dc8b2e5d9d91162ce2cc11" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "appsumo" (
                "uuid" character varying NOT NULL,
                "plan_id" character varying NOT NULL,
                "activation_email" character varying NOT NULL,
                CONSTRAINT "PK_3589df5be2973351814f727ae86" PRIMARY KEY ("uuid")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "platform_plan" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "plan" character varying,
                "includedAiCredits" integer NOT NULL,
                "aiCreditsOverageLimit" integer,
                "aiCreditsOverageState" character varying,
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
                "teamProjectsLimit" character varying NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "licenseKey" character varying,
                "stripeCustomerId" character varying,
                "stripeSubscriptionId" character varying,
                "stripeSubscriptionStatus" character varying,
                "tablesEnabled" boolean NOT NULL,
                "todosEnabled" boolean NOT NULL,
                "projectsLimit" integer,
                "agentsEnabled" boolean NOT NULL,
                "activeFlowsLimit" integer,
                "mcpsEnabled" boolean NOT NULL,
                "dedicatedWorkers" jsonb,
                CONSTRAINT "PK_d08fdd63b2b6e31d68b0134977f" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_plan_platform_id" ON "platform_plan" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "stripeCustomerId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "stripeSubscriptionId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "subscriptionStartDatetime"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "platformId" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "pieces" character varying array NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "locked" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "piecesFilterType" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "aiCredits" integer
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "custom_domain"
            ADD CONSTRAINT "fk_custom_domain_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_app"
            ADD CONSTRAINT "fk_oauth_app_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD CONSTRAINT "fk_otp_identity_id" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "api_key"
            ADD CONSTRAINT "fk_api_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD CONSTRAINT "fk_git_repo_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ADD CONSTRAINT "FK_8188cdbf5c16c58d431efddd451" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_imported_by" FOREIGN KEY ("importedBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release"
            ADD CONSTRAINT "fk_project_release_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
            ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential"
            ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD CONSTRAINT "fk_platform_plan_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.COMMUNITY])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP CONSTRAINT "fk_platform_plan_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_imported_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_release" DROP CONSTRAINT "fk_project_release_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event" DROP CONSTRAINT "FK_8188cdbf5c16c58d431efddd451"
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP CONSTRAINT "fk_git_repo_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "api_key" DROP CONSTRAINT "fk_api_key_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_identity_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_app" DROP CONSTRAINT "fk_oauth_app_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "custom_domain" DROP CONSTRAINT "fk_custom_domain_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "aiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "piecesFilterType"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "locked"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "pieces"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "subscriptionStartDatetime" TIMESTAMP WITH TIME ZONE NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "stripeSubscriptionId" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "stripeCustomerId" character varying NOT NULL
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_platform_plan_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_plan"
        `)
        await queryRunner.query(`
            DROP TABLE "appsumo"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_release_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_release"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."audit_event_platform_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."audit_event_platform_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."audit_event_platform_id_project_id_user_id_action_idx"
        `)
        await queryRunner.query(`
            DROP TABLE "audit_event"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_git_repo_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "git_repo"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_template_tags"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `)
        await queryRunner.query(`
            DROP TABLE "api_key"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_otp_identity_id_type"
        `)
        await queryRunner.query(`
            DROP TABLE "otp"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_oauth_app_platformId_pieceName"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_app"
        `)
        await queryRunner.query(`
            DROP TABLE "signing_key"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."custom_domain_domain_unique"
        `)
        await queryRunner.query(`
            DROP TABLE "custom_domain"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_credentials_projectId_appName" ON "app_credential" ("appName", "projectId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_plan_stripe_customer_id" ON "project_plan" ("stripeCustomerId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("created", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential"
            ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
            ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
