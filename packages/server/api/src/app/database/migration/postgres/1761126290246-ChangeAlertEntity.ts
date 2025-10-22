import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeAlertEntity1761126290246 implements MigrationInterface {
    name = 'ChangeAlertEntity1761126290246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN IF EXISTS "notifyStatus"
        `);
        await queryRunner.query(`
            ALTER TABLE "alert" DROP COLUMN IF EXISTS "receiver"
        `);
        await queryRunner.query(`
            ALTER TABLE "alert"
            ADD "name" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "alert"
            ADD "description" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "alert"
            ADD "receivers" character varying array NOT NULL DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "alert"
            ADD "events" character varying array NOT NULL DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "alert" DROP COLUMN "events"
        `);
        await queryRunner.query(`
            ALTER TABLE "alert" DROP COLUMN "receivers"
        `);
        await queryRunner.query(`
            ALTER TABLE "alert"
            ADD "receiver" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "notifyStatus" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

}
