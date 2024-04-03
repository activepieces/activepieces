import * as crypto from 'crypto'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger, system, SystemProp } from '@activepieces/server-shared'

type AppConnectionValue = {
    type: string
}
const algorithm = 'aes-256-cbc'

export class AddAppConnectionTypeToTopLevel1691703023866
implements MigrationInterface {
    name = 'AddAppConnectionTypeToTopLevel1691703023866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddAppConnectionTypeToTopLevel1691703023866 up')

        await queryRunner.query(
            'ALTER TABLE "app_connection" ADD "type" character varying',
        )

        const connections = await queryRunner.query('SELECT * FROM app_connection')

        for (const currentConnection of connections) {
            try {
                const connectionValue = decryptObject<AppConnectionValue>(
                    currentConnection.value,
                )
                await queryRunner.query(
                    `UPDATE "app_connection" SET "type" = '${connectionValue.type}' WHERE id = '${currentConnection.id}'`,
                )
            }
            catch (e) {
                logger.error(e)
            }
        }

        await queryRunner.query(
            'ALTER TABLE "app_connection" ALTER COLUMN "type" SET NOT NULL',
        )

        logger.info('AddAppConnectionTypeToTopLevel1691703023866 finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddAppConnectionTypeToTopLevel1691703023866 down')

        await queryRunner.query('ALTER TABLE "app_connection" DROP COLUMN "type"')

        logger.info('AddAppConnectionTypeToTopLevel1691703023866 finished')
    }
}

function decryptObject<T>(encryptedObject: { iv: string, data: string }): T {
    const iv = Buffer.from(encryptedObject.iv, 'hex')
    const key = Buffer.from(
        system.getOrThrow(SystemProp.ENCRYPTION_KEY),
        'binary',
    )
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted)
}
