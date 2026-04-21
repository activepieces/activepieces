import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpOAuthTables1774500000000 implements MigrationInterface {
    name = 'AddMcpOAuthTables1774500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_oauth_client" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "clientId" character varying(64) NOT NULL,
                "clientSecret" character varying(128),
                "clientSecretExpiresAt" bigint NOT NULL DEFAULT 0,
                "clientIdIssuedAt" bigint NOT NULL,
                "redirectUris" character varying[] NOT NULL,
                "clientName" character varying(255),
                "grantTypes" character varying[] NOT NULL,
                "tokenEndpointAuthMethod" character varying(64) NOT NULL DEFAULT 'none',
                CONSTRAINT "PK_mcp_oauth_client" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_oauth_client_client_id" ON "mcp_oauth_client" ("clientId")
        `)

        await queryRunner.query(`
            CREATE TABLE "mcp_oauth_authorization_code" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" character varying(128) NOT NULL,
                "clientId" character varying(64) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "redirectUri" character varying(2048) NOT NULL,
                "codeChallenge" character varying(256) NOT NULL,
                "codeChallengeMethod" character varying(8) NOT NULL DEFAULT 'S256',
                "scopes" character varying[],
                "state" character varying(512),
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_mcp_oauth_authorization_code" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_oauth_code" ON "mcp_oauth_authorization_code" ("code")
        `)

        await queryRunner.query(`
            CREATE TABLE "mcp_oauth_token" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "refreshToken" character varying(128) NOT NULL,
                "clientId" character varying(64) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "scopes" character varying[],
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_mcp_oauth_token" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_oauth_token_refresh" ON "mcp_oauth_token" ("refreshToken")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_mcp_oauth_token_refresh"')
        await queryRunner.query('DROP TABLE "mcp_oauth_token"')
        await queryRunner.query('DROP INDEX "idx_mcp_oauth_code"')
        await queryRunner.query('DROP TABLE "mcp_oauth_authorization_code"')
        await queryRunner.query('DROP INDEX "idx_mcp_oauth_client_client_id"')
        await queryRunner.query('DROP TABLE "mcp_oauth_client"')
    }
}
