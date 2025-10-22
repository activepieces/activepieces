import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveFlowRunDisplayName1759772332795 implements MigrationInterface {
    name = 'RemoveFlowRunDisplayName1759772332795'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "flowDisplayName"
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_flow_version_id" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION NOT VALID
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_flow_version_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "flowDisplayName" character varying NOT NULL
        `)
    }
}
