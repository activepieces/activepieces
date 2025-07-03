import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAiProviderSqlite1726446345221 implements MigrationInterface {
    name = 'AddAiProviderSqlite1726446345221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "baseUrl" varchar NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_ai_provider_platform_id_provider"')
        await queryRunner.query('DROP TABLE "ai_provider"')
    }

}
