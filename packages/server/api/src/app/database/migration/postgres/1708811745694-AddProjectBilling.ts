import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddProjectBilling1708811745694 implements MigrationInterface {
    name = 'AddProjectBilling1708811745694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "project_billing" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "stripeCustomerId" character varying NOT NULL,
                "includedTasks" integer,
                "includedUsers" integer,
                "stripeSubscriptionId" character varying,
                "subscriptionStatus" character varying,
                CONSTRAINT "REL_915ee7969204c1118a3605da64" UNIQUE ("projectId"),
                CONSTRAINT "PK_07b2429736c158fbe490cd67e4b" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_stripe_project_id" ON "project_billing" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_billing"
            ADD CONSTRAINT "fk_project_stripe_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project_billing" DROP CONSTRAINT "fk_project_stripe_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_stripe_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_billing"
        `)
    }

}
