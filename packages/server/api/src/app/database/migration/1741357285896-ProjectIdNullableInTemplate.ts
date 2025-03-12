import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProjectIdNullableInTemplate1741357285896 implements MigrationInterface {
    name = 'ProjectIdNullableInTemplate1741357285896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ALTER COLUMN "projectId" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            UPDATE "flow_template"
            SET "projectId" = NULL
            WHERE "type" = 'PLATFORM'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ALTER COLUMN "projectId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
