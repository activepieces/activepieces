import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPriorityToFlow1774500000000 implements MigrationInterface {
    name = 'AddPriorityToFlow1774500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" ADD COLUMN IF NOT EXISTS "priority" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "priority"
        `)
    }
}
