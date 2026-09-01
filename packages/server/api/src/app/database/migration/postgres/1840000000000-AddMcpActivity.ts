import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMcpActivity1840000000000 implements Migration {
    name = 'AddMcpActivity1840000000000'
    breaking = false
    release = '0.88.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mcp_activity" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "userId" character varying(21) NOT NULL,
                "toolName" character varying(128) NOT NULL,
                "status" character varying(32) NOT NULL,
                "pieceName" character varying(256),
                "actionName" character varying(256),
                "connectionExternalId" character varying(256),
                "errorMessage" character varying(2000),
                "durationMs" integer NOT NULL,
                "payloadFileId" character varying(21),
                "payloadTruncated" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_mcp_activity_id" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mcp_activity_platform_id_created_id"
            ON "mcp_activity" ("platformId", "created", "id")
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mcp_activity_project_id_created_id"
            ON "mcp_activity" ("projectId", "created", "id")
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mcp_activity_payload_file_id"
            ON "mcp_activity" ("payloadFileId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            DROP CONSTRAINT IF EXISTS "fk_mcp_activity_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            ADD CONSTRAINT "fk_mcp_activity_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            DROP CONSTRAINT IF EXISTS "fk_mcp_activity_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            ADD CONSTRAINT "fk_mcp_activity_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            DROP CONSTRAINT IF EXISTS "fk_mcp_activity_payload_file_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            ADD CONSTRAINT "fk_mcp_activity_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "mcp_activity"')
    }
}
