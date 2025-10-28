import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBuilderMessageEntity1758704404389 implements MigrationInterface {
    name = 'AddBuilderMessageEntity1758704404389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "builder_message" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "role" character varying NOT NULL,
                "content" character varying NOT NULL,
                "usage" jsonb,
                CONSTRAINT "PK_0cf26c93ce5e5d500f84f2b340a" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_builder_message_project_flow" ON "builder_message" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            ALTER TABLE "builder_message"
            ADD CONSTRAINT "FK_257ee9c3bc160ef16b2af94c334" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "builder_message"
            ADD CONSTRAINT "FK_f34e2ab61f888e97825eba6d477" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "builder_message" DROP CONSTRAINT "FK_f34e2ab61f888e97825eba6d477"
        `)
        await queryRunner.query(`
            ALTER TABLE "builder_message" DROP CONSTRAINT "FK_257ee9c3bc160ef16b2af94c334"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_builder_message_project_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "builder_message"
        `)
    }

}
