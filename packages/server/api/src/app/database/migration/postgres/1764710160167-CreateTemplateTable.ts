import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTemplateTable1764710160167 implements MigrationInterface {
    name = 'CreateTemplateTable1764710160167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_template_tags"
        `)
        await queryRunner.query(`
            CREATE TABLE "template" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "flowTemplateId" character varying(21),
                "tags" jsonb NOT NULL,
                "blogUrl" character varying,
                "metadata" jsonb,
                "usageCount" integer NOT NULL,
                "author" character varying NOT NULL,
                "categories" character varying array NOT NULL,
                CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_template_flow_template_id" ON "template" ("flowTemplateId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_template_categories" ON "template" ("categories")
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "name"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "description"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "tags"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "blogUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "type"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "scope" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD CONSTRAINT "fk_template_flow_template_id" FOREIGN KEY ("flowTemplateId") REFERENCES "flow_template"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Nothing to do
    }

}
