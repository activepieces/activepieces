import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowTemplate1741587483735 implements MigrationInterface {
    name = 'AddFlowTemplate1741587483735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "flow_template" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "type" character varying NOT NULL,
                "platformId" character varying NOT NULL,
                "projectId" character varying,
                "template" jsonb NOT NULL,
                "tags" character varying array NOT NULL,
                "pieces" character varying array NOT NULL,
                "blogUrl" character varying,
                CONSTRAINT "PK_fcacbf8776a0a3337eb8eca7478" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_template_tags"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `)
    }

}
