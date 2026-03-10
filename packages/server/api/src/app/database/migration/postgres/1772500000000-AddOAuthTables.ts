import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOAuthTables1772500000000 implements MigrationInterface {
    name = 'AddOAuthTables1772500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "oauth_client" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "clientId" character varying NOT NULL,
                "clientSecretHash" character varying,
                "clientName" character varying NOT NULL,
                "redirectUris" jsonb NOT NULL,
                "grantTypes" jsonb NOT NULL,
                "platformId" character varying(21) NOT NULL,
                CONSTRAINT "PK_oauth_client" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_client_client_id" ON "oauth_client" ("clientId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_oauth_client_platform_id" ON "oauth_client" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_client"
            ADD CONSTRAINT "fk_oauth_client_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            CREATE TABLE "oauth_authorization_code" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" character varying NOT NULL,
                "clientId" character varying NOT NULL,
                "userId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "scopes" jsonb NOT NULL,
                "codeChallenge" character varying NOT NULL,
                "codeChallengeMethod" character varying NOT NULL,
                "redirectUri" character varying NOT NULL,
                "resource" character varying,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_oauth_authorization_code" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_authorization_code_code" ON "oauth_authorization_code" ("code")
        `)

        await queryRunner.query(`
            CREATE TABLE "oauth_refresh_token" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tokenHash" character varying NOT NULL,
                "clientId" character varying NOT NULL,
                "userId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "scopes" jsonb NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_oauth_refresh_token" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_refresh_token_hash" ON "oauth_refresh_token" ("tokenHash")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "oauth_refresh_token"')
        await queryRunner.query('DROP TABLE "oauth_authorization_code"')
        await queryRunner.query('DROP INDEX "public"."idx_oauth_client_platform_id"')
        await queryRunner.query('DROP TABLE "oauth_client"')
    }
}
