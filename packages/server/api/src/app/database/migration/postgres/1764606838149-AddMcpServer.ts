import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpServer1764606838149 implements MigrationInterface {
    name = 'AddMcpServer1764606838149'

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
    `)
        await queryRunner.query(`
      CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
    `)
        await queryRunner.query(`
      ALTER TABLE "mcp_server"
      ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
    `)
        await queryRunner.query(`
      DROP INDEX "mcp_server_project_id"
    `)
        await queryRunner.query(`
      DROP TABLE "mcp_server"
    `)
    }
}
