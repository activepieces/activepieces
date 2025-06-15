import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentOutput1749859119064 implements MigrationInterface {
    name = 'AddAgentOutput1749859119064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "outputType" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "outputFields" jsonb NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "outputFields"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "outputType"
        `)
    }

}
