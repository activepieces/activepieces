import { MigrationInterface, QueryRunner } from 'typeorm'

export class RevertTodoActivties1751217652277 implements MigrationInterface {
    name = 'RevertTodoActivties1751217652277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "todo_activity"
        `)

        await queryRunner.query(`
            DELETE FROM "todo" 
            WHERE "agentId" IS NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "agentId"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP COLUMN "agentId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD "agentId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "agentId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_agent_id" ON "todo" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
