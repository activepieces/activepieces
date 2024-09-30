import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddTemplates1685538145476 implements MigrationInterface {
    name = 'AddTemplates1685538145476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "flow_template" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "template" jsonb NOT NULL, "tags" character varying array NOT NULL, "pieces" character varying array NOT NULL, CONSTRAINT "PK_fcacbf8776a0a3337eb8eca7478" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query('DROP INDEX "idx_flow_template_pieces"')
        await queryRunner.query('DROP INDEX "idx_flow_template_tags"')
        await queryRunner.query('DROP TABLE "flow_template"')
    }
}
