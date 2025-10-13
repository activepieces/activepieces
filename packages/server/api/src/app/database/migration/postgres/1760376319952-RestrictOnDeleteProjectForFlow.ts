import { MigrationInterface, QueryRunner } from "typeorm";

export class RestrictOnDeleteProjectForFlow1760376319952 implements MigrationInterface {
    name = 'RestrictOnDeleteProjectForFlow1760376319952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle"
            SET DEFAULT 'monthly'
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
