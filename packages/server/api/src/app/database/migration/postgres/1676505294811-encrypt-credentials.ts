import { MigrationInterface, QueryRunner } from 'typeorm'
import { encryptUtils } from '../../../helper/encryption'
import { logger } from '@activepieces/server-shared'

export class encryptCredentials1676505294811 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('encryptCredentials1676505294811 up: started')
        const connections = await queryRunner.query('SELECT * FROM app_connection')
        for (const currentConnection of connections) {
            currentConnection.value = encryptUtils.encryptObject(currentConnection.value)
            await queryRunner.query(
                `UPDATE app_connection SET value = '${JSON.stringify(
                    currentConnection.value,
                )}' WHERE id = ${currentConnection.id}`,
            )
        }
        logger.info('encryptCredentials1676505294811 up: finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('encryptCredentials1676505294811 down: started')
        const connections = await queryRunner.query('SELECT * FROM app_connection')
        for (const currentConnection of connections) {
            try {
                currentConnection.value = encryptUtils.decryptObject(currentConnection.value)
                await queryRunner.query(
                    `UPDATE app_connection SET value = '${JSON.stringify(
                        currentConnection.value,
                    )}' WHERE id = ${currentConnection.id}`,
                )
            }
            catch (e) {
                logger.error(e)
            }
        }
        logger.info('encryptCredentials1676505294811 down: finished')
    }
}
