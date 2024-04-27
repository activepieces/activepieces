import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class CascadeProjectDeleteAppCredentialsAndConnectionKey1710720610669 implements MigrationInterface {
    name = 'CascadeProjectDeleteAppCredentialsAndConnectionKey1710720610669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
        ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
    `)
        await queryRunner.query(`
        ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
    `)
        await queryRunner.query(`
            ALTER TABLE "connection_key"
            ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id")
                ON DELETE CASCADE ON UPDATE NO ACTION
        `)


        await queryRunner.query(`
            ALTER TABLE "app_credential"
            ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id")
                ON DELETE CASCADE ON UPDATE NO ACTION
        `)


        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
        ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
    `)
        await queryRunner.query(`
        ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
    `)
        await queryRunner.query(`
            ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"
        `)

        await queryRunner.query(`
            ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"
        `)

        logger.info({ name: this.name }, 'down')
    }
}
