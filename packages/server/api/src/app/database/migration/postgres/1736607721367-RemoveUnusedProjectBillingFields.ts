import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUnusedProjectBillingFields1736607721367 implements MigrationInterface {
    name = 'RemoveUnusedProjectBillingFields1736607721367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "minimumPollingInterval"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "connections"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "teamMembers"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "tasks" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "aiTokens" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "aiTokens"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "tasks"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "teamMembers" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "connections" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "minimumPollingInterval" integer NOT NULL
        `)
    }

}
