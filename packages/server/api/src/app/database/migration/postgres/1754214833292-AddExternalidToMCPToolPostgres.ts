import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalidToMCPToolPostgres1754214833292 implements MigrationInterface {
    name = 'AddExternalidToMCPToolPostgres1754214833292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD "externalId" character varying(21)
        `)
        await queryRunner.query(`
            UPDATE "mcp_tool"
            SET "externalId" = "id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ALTER COLUMN "externalId" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP COLUMN "externalId"
        `)
    }

}
