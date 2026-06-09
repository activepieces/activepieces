import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentTestPrompt1754863565929 implements MigrationInterface {
    name = 'RemoveAgentTestPrompt1754863565929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "testPrompt"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "testPrompt" character varying NOT NULL
        `)
    }

}
