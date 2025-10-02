import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutgoingWebhooks1759332023650 implements MigrationInterface {
    name = 'AddOutgoingWebhooks1759332023650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `);
        await queryRunner.query(`
            CREATE TABLE "outgoing_webhook" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "scope" character varying NOT NULL,
                "events" character varying array NOT NULL,
                "url" character varying NOT NULL,
                CONSTRAINT "PK_83e09f2d5f371616d444f8ad27c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_platform_scope" ON "outgoing_webhook" ("platformId")
            WHERE scope = 'PLATFORM'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_project_scope" ON "outgoing_webhook" ("projectId")
            WHERE scope = 'PROJECT'
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "platformId" character varying NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
        await queryRunner.query(`
            ALTER TABLE "outgoing_webhook"
            ADD CONSTRAINT "fk_outgoing_webhook_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "outgoing_webhook"
            ADD CONSTRAINT "fk_outgoing_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "outgoing_webhook" DROP CONSTRAINT "fk_outgoing_webhook_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "outgoing_webhook" DROP CONSTRAINT "fk_outgoing_webhook_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "platformId"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_outgoing_webhook_project_scope"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_outgoing_webhook_platform_scope"
        `);
        await queryRunner.query(`
            DROP TABLE "outgoing_webhook"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("created", "projectId")
        `);
    }

}
