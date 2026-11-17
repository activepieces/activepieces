import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEmailDomainAndSsoProviderTables1882000000000 implements Migration {
    name = 'AddEmailDomainAndSsoProviderTables1882000000000'
    breaking = false
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "email_domain" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "domain" character varying NOT NULL,
                "verificationStatus" character varying NOT NULL,
                "verificationRecordValue" character varying NOT NULL,
                CONSTRAINT "pk_email_domain" PRIMARY KEY ("id"),
                CONSTRAINT "fk_email_domain_platform_id" FOREIGN KEY ("platformId")
                    REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_email_domain_platform_id_domain"
            ON "email_domain" ("platformId", "domain")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_email_domain_verified_domain"
            ON "email_domain" ("domain")
            WHERE "verificationStatus" = 'VERIFIED'
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sso_provider" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "protocol" character varying NOT NULL,
                "status" character varying NOT NULL,
                "config" jsonb NOT NULL,
                CONSTRAINT "pk_sso_provider" PRIMARY KEY ("id"),
                CONSTRAINT "fk_sso_provider_platform_id" FOREIGN KEY ("platformId")
                    REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_sso_provider_platform_id"
            ON "sso_provider" ("platformId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_sso_provider_platform_id_not_draft"
            ON "sso_provider" ("platformId")
            WHERE "status" <> 'DRAFT'
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_sso_provider_platform_id_draft"
            ON "sso_provider" ("platformId")
            WHERE "status" = 'DRAFT'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "sso_provider"')
        await queryRunner.query('DROP TABLE IF EXISTS "email_domain"')
    }
}
