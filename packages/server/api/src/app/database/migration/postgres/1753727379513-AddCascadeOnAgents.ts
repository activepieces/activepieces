import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCascadeOnAgents1753727379513 implements MigrationInterface {
    name = 'AddCascadeOnAgents1753727379513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "FK_7103e2d16e62e3e3dc335307175"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ALTER COLUMN "metadata" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "fk_agent_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "fk_agent_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ALTER COLUMN "metadata"
            SET DEFAULT '{"feature": "Unknown"}'
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
