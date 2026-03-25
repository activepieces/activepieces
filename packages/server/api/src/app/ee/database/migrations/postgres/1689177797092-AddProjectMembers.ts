import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddProjectMembers1689177797092 implements MigrationInterface {
    name = 'AddProjectMembers1689177797092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "project_member" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying(21) NOT NULL, "projectId" character varying(21) NOT NULL, "role" character varying NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_project_member_project_id_user_id" ON "project_member" ("projectId", "userId") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'DROP INDEX "idx_project_member_project_id_user_id"',
        )
        await queryRunner.query('DROP TABLE "project_member"')
    }
}
