import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepsToFlowVersion1771167183105 implements MigrationInterface {
    name = 'AddStepsToFlowVersion1771167183105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "steps" jsonb NOT NULL DEFAULT '[]'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "steps"
        `)
    }

}
