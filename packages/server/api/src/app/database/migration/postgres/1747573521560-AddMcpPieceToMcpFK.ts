import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpPieceToMcpFK1747573521560 implements MigrationInterface {
    name = 'AddMcpPieceToMcpFK1747573521560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP CONSTRAINT "fk_mcp_piece_mcp_id"
        `)
    }

}
