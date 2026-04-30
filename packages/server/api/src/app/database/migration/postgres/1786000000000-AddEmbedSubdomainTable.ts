import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEmbedSubdomainTable1786000000000 implements Migration {
    name = 'AddEmbedSubdomainTable1786000000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "embed_subdomain" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "hostname" character varying NOT NULL,
                "status" character varying NOT NULL,
                "cloudflareId" character varying NOT NULL,
                "verificationRecords" jsonb NOT NULL DEFAULT '[]'::jsonb,
                CONSTRAINT "pk_embed_subdomain" PRIMARY KEY ("id"),
                CONSTRAINT "fk_embed_subdomain_platform_id" FOREIGN KEY ("platformId")
                    REFERENCES "platform" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_embed_subdomain_platform_id"
            ON "embed_subdomain" ("platformId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_embed_subdomain_hostname"
            ON "embed_subdomain" ("hostname")
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "allowedEmbedDomains" character varying[] NOT NULL DEFAULT '{}'
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "googleAuthEnabled" boolean NOT NULL DEFAULT true
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "ssoDomain" character varying
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_platform_sso_domain"
            ON "platform" ("ssoDomain")
            WHERE "ssoDomain" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_platform_sso_domain"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "ssoDomain"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "googleAuthEnabled"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "allowedEmbedDomains"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_embed_subdomain_hostname"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_embed_subdomain_platform_id"')
        await queryRunner.query('DROP TABLE IF EXISTS "embed_subdomain"')
    }
}
