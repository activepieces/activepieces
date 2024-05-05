import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddGitRepoMigrationPostgres1704503804056
implements MigrationInterface {
    name = 'AddGitRepoMigrationPostgres1704503804056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "git_repo" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "remoteUrl" character varying NOT NULL,
                "branch" character varying NOT NULL,
                "sshPrivateKey" character varying,
                CONSTRAINT "REL_5b59d96420074128fc1d269b9c" UNIQUE ("projectId"),
                CONSTRAINT "PK_de881ac6eac39e4d9ba7c5ed3e6" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_git_repo_project_id" ON "git_repo" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD CONSTRAINT "fk_git_repo_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP CONSTRAINT "fk_git_repo_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_git_repo_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "git_repo"
        `)
    }
}
