import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeMcpProjectIdIdx1747253720779 implements MigrationInterface {
    name = 'ChangeMcpProjectIdIdx1747253720779'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}
