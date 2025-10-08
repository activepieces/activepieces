import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowIdAndStepNameIntoMCPEntity1759923770044 implements MigrationInterface {
    name = 'AddFlowIdAndStepNameIntoMCPEntity1759923770044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "flowId" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "stepName" character varying
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_flow_id_step_name" ON "mcp" ("flowId", "stepName")
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD CONSTRAINT "FK_4995fc49e7c658cf883a56542bf" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP CONSTRAINT "FK_4995fc49e7c658cf883a56542bf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."mcp_flow_id_step_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "stepName"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "flowId"
        `);
    }
}
