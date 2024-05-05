import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class UnifyEnterpriseWithCloud1714249840058 implements MigrationInterface {
    name = 'UnifyEnterpriseWithCloud1714249840058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_credentials_projectId_appName"
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
            ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential"
            ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_credentials_projectId_appName" ON "app_credential" ("appName", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "app_credential"
            ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
            ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
