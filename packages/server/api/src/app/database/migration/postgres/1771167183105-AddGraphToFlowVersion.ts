import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGraphToFlowVersion1771167183105 implements MigrationInterface {
    name = 'AddGraphToFlowVersion1771167183105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            RENAME COLUMN "trigger" TO "graph"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            RENAME COLUMN "graph" TO "trigger"
        `)
    }
}
