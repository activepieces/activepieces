import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentsModule1748456786940 implements MigrationInterface {
    name = 'AddAgentsModule1748456786940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "profilePictureUrl" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "description" character varying NOT NULL,
                "testPrompt" character varying NOT NULL,
                "systemPrompt" character varying NOT NULL,
                "projectId" character varying NOT NULL,
                "maxSteps" integer NOT NULL,
                "platformId" character varying NOT NULL,
                CONSTRAINT "PK_1000e989398c5d4ed585cf9a46f" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "agentId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ALTER COLUMN "flowId" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "FK_7103e2d16e62e3e3dc335307175"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ALTER COLUMN "flowId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "agentId"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
    }

}
