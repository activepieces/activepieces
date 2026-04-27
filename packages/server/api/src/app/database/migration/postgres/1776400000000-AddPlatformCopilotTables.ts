import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlatformCopilotTables1776400000000 implements Migration {
    name = 'AddPlatformCopilotTables1776400000000'
    breaking = false
    release = '0.83.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_copilot_credentials" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "copilotApiKey" jsonb NOT NULL,
                CONSTRAINT "PK_platform_copilot_credentials" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_copilot_credentials_platform_id"
            ON "platform_copilot_credentials" ("platformId")
        `)

        await queryRunner.query(`
            CREATE TABLE "copilot_platform_registry" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "copilotApiKeyHash" character varying NOT NULL,
                "edition" character varying NOT NULL,
                "version" character varying NOT NULL,
                "blockedAt" TIMESTAMP WITH TIME ZONE,
                "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_copilot_platform_registry" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_copilot_platform_registry_platform_id"
            ON "copilot_platform_registry" ("platformId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_copilot_platform_registry_api_key_hash"
            ON "copilot_platform_registry" ("copilotApiKeyHash")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_copilot_platform_registry_api_key_hash"')
        await queryRunner.query('DROP INDEX "idx_copilot_platform_registry_platform_id"')
        await queryRunner.query('DROP TABLE "copilot_platform_registry"')
        await queryRunner.query('DROP INDEX "idx_platform_copilot_credentials_platform_id"')
        await queryRunner.query('DROP TABLE "platform_copilot_credentials"')
    }
}
