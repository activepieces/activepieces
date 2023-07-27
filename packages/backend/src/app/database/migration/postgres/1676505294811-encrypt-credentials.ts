import { MigrationInterface, QueryRunner } from 'typeorm'
import { decryptObject, encryptObject } from '../../../helper/encryption'
import { logger } from '../../../helper/logger'

export class encryptCredentials1676505294811 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('encryptCredentials1676505294811 up: started')
        const appConnections = queryRunner.connection.getRepository('app_connection')
        const connections = await appConnections.find({})
        for (let i = 0; i < connections.length; ++i) {
            const currentConnection = connections[i]
            currentConnection.value = encryptObject(currentConnection.value)
            await appConnections.update(currentConnection.id, currentConnection)
        }
        logger.info('encryptCredentials1676505294811 up: finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('encryptCredentials1676505294811 down: started')
        const appConnections = queryRunner.connection.getRepository('app_connection')
        const connections = await appConnections.find({})
        for (let i = 0; i < connections.length; ++i) {
            try {
                const currentConnection = connections[i]
                currentConnection.value = decryptObject(currentConnection.value)
                await appConnections.update(currentConnection.id, currentConnection)
            }
            catch (e) {
                logger.error(e)
            }
        }
        logger.info('encryptCredentials1676505294811 down: finished')
    }

}
