import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class billing1677286751592 implements MigrationInterface {
    name = 'billing1677286751592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration billing1677286751592')
        await queryRunner.query(
            'DROP INDEX "public"."idx_app_connection_project_id_and_app_name_and_name"',
        )
        await queryRunner.query(
            'CREATE TABLE "project_plan" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "name" character varying NOT NULL, "stripeCustomerId" character varying NOT NULL, "stripeSubscriptionId" character varying NOT NULL, "tasks" integer NOT NULL, "subscriptionStartDatetime" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_4f52e89612966d95843e4158bb" UNIQUE ("projectId"), CONSTRAINT "PK_759d33fce71c95de832df935841" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_plan_project_id" ON "project_plan" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_plan_stripe_customer_id" ON "project_plan" ("stripeCustomerId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "project_usage" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "consumedTasks" integer NOT NULL, "nextResetDatetime" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_c407fc9b2bfb44515af69d575a" UNIQUE ("projectId"), CONSTRAINT "PK_100c1959e9dc487c4cadbf9cb56" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_project_usage_project_id" ON "project_usage" ("projectId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD CONSTRAINT "fk_project_plan_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD CONSTRAINT "fk_project_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        logger.info('Finished migration billing1677286751592')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('rolling back migration billing1677286751592')
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP CONSTRAINT "fk_project_usage_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP CONSTRAINT "fk_project_plan_project_id"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."idx_project_usage_project_id"',
        )
        await queryRunner.query('DROP TABLE "project_usage"')
        await queryRunner.query(
            'DROP INDEX "public"."idx_plan_stripe_customer_id"',
        )
        await queryRunner.query('DROP INDEX "public"."idx_plan_project_id"')
        await queryRunner.query('DROP TABLE "project_plan"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_app_name_and_name" ON "app_connection" ("name", "appName", "projectId") ',
        )
        logger.info('Finished rolling back billing1677286751592')
    }
}
