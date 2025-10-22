import { MigrationInterface, QueryRunner } from 'typeorm'

export class RestrictOnDeleteProjectForFlow1760376319952 implements MigrationInterface {
    name = 'RestrictOnDeleteProjectForFlow1760376319952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "project" WHERE deleted IS NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}