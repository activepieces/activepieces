import { MigrationInterface, QueryRunner } from 'typeorm'
import { decryptObject } from '../../../helper/encryption'
import { logger } from '../../../helper/logger'

type AppConnectionValue = {
    type: string
}

export class AddAppConnectionTypeToTopLevel1691703023866 implements MigrationInterface {
    name = 'AddAppConnectionTypeToTopLevel1691703023866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddAppConnectionTypeToTopLevel1691703023866 up')

        await queryRunner.query('ALTER TABLE "app_connection" ADD "type" character varying')

        const connections = await queryRunner.query('SELECT * FROM app_connection')

        for (const currentConnection of connections) {
            try {
                const connectionValue = decryptObject<AppConnectionValue>(currentConnection.value)
                await queryRunner.query(`UPDATE "app_connection" SET "type" = '${connectionValue.type}' WHERE id = '${currentConnection.id}'`)
            }
            catch (e) {
                logger.error(e)
            }
        }

        await queryRunner.query('ALTER TABLE "app_connection" ALTER COLUMN "type" SET NOT NULL')

        logger.info('AddAppConnectionTypeToTopLevel1691703023866 finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddAppConnectionTypeToTopLevel1691703023866 down')

        await queryRunner.query('ALTER TABLE "app_connection" DROP COLUMN "type"')

        logger.info('AddAppConnectionTypeToTopLevel1691703023866 finished')
    }

}
