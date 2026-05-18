import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndiciesToRunSqlite1732324481815 implements MigrationInterface {
    name = 'AddIndiciesToRunSqlite1732324481815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
        `)
    }

}
