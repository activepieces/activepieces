import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameIncludedTasksToTasksLimit1750722071472 implements MigrationInterface {
    name = 'RenameIncludedTasksToTasksLimit1750722071472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "includedTasks" TO "tasksLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "tasksLimit" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "tasksLimit"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "tasksLimit" TO "includedTasks"
        `)
    }

}
