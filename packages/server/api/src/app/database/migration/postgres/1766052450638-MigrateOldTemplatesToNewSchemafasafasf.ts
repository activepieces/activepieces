import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateOldTemplatesToNewSchemafasafasf1766052450638 implements MigrationInterface {
    name = 'MigrateOldTemplatesToNewSchemafasafasf1766052450638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_server" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "token" character varying NOT NULL,
                CONSTRAINT "PK_940f98ed91dd060f63e6fc5634e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `);
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "summary"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
        `);
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "summary" character varying NOT NULL
        `);
        await queryRunner.query(`
            DROP INDEX "public"."mcp_server_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_server"
        `);
    }

}
