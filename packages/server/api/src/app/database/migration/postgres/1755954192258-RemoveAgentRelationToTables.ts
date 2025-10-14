import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentRelationToTables1755954192258 implements MigrationInterface {
    name = 'RemoveAgentRelationToTables1755954192258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "UQ_6c8e7a0da6e6cbc9b5bfc806648"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "agentId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD "agentId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "UQ_6c8e7a0da6e6cbc9b5bfc806648" UNIQUE ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
