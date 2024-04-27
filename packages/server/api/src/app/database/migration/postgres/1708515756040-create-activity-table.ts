import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class CreateActivityTable1708515756040 implements MigrationInterface {
    name = 'CreateActivityTable1708515756040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "activity" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "event" character varying NOT NULL,
                "message" character varying NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_activity_project_id_created_desc" ON "activity" ("projectId", "created" DESC)
        `)
        await queryRunner.query(`
            ALTER TABLE "activity"
            ADD CONSTRAINT "fk_activity_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "activity" DROP CONSTRAINT "fk_activity_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_project_id_created_desc"
        `)
        await queryRunner.query(`
            DROP TABLE "activity"
        `)

        logger.info({ name: this.name }, 'down')
    }
}
