import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentIdToTable1753315220453 implements MigrationInterface {
    name = 'AddAgentIdToTable1753315220453'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            ADD "trigger" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD "status" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD "metadata" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ALTER COLUMN "startTime" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ALTER COLUMN "startTime"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP COLUMN "metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "status"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "trigger"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "UQ_6c8e7a0da6e6cbc9b5bfc806648"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP COLUMN "agentId"
        `)
    }

}
