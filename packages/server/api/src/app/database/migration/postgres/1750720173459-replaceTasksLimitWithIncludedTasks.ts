import { MigrationInterface, QueryRunner } from 'typeorm'

export class ReplaceTasksLimitWithIncludedTasks1750720173459 implements MigrationInterface {
    name = 'ReplaceTasksLimitWithIncludedTasks1750720173459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "tasksLimit"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "tasksLimit" integer
        `)
    }

}
