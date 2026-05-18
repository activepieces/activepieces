import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTasksToRun1689351564290 implements MigrationInterface {
    name = 'AddTasksToRun1689351564290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_run" ADD "tasks" integer')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "tasks"')
    }
}
