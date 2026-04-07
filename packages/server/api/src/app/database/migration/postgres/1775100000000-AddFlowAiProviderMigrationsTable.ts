import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowAiProviderMigrationsTable1775100000000 implements Migration {
    name = 'AddFlowAiProviderMigrationsTable1775100000000'
    breaking = false
    release = '0.81.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "flow_ai_provider_migration" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'RUNNING',
                "totalVersions" integer NOT NULL DEFAULT 0,
                "processedVersions" integer NOT NULL DEFAULT 0,
                "failedFlowVersions" jsonb NOT NULL DEFAULT '[]',
                "sourceModel" jsonb NOT NULL,
                "targetModel" jsonb NOT NULL,
                "projectIds" jsonb,
                CONSTRAINT "pk_flow_ai_provider_migration" PRIMARY KEY ("id"),
                CONSTRAINT "fk_flow_ai_provider_migration_platform" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_ai_provider_migration_platform_id" ON "flow_ai_provider_migration" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_flow_ai_provider_migration_platform_id"')
        await queryRunner.query('DROP TABLE "flow_ai_provider_migration"')
    }
}
