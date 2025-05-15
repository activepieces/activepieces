import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpName1747335239942 implements MigrationInterface {
    name = 'AddMcpName1747335239942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "name" character varying NOT NULL DEFAULT 'MCP Server'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "name"
        `);
    }

}
