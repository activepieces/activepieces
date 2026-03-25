import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeMcpPieceForeignKey1746543299109 implements MigrationInterface {
    name = 'ChangeMcpPieceForeignKey1746543299109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP CONSTRAINT "fk_mcp_piece_mcp_id"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
