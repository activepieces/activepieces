import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const FLOW_VERSION_TABLE = 'flow_version'

const log = system.globalLogger()

export class MigrateWebhook1709581196563 implements MigrationInterface {
    name = 'MigrateWebhook1709581196563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('MigrateWebhook1709581196563, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_version')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_version WHERE id = $1', [id])
            const step = parseJson(flowVersion.trigger)
            const isString = typeof flowVersion.trigger === 'string'
            if (step.type === 'WEBHOOK') {
                step.type = 'PIECE_TRIGGER'
                step.settings = {
                    input: {},
                    'inputUiInfo': step.settings.inputUiInfo,
                    triggerName: 'catch_request',
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '0.0.1',
                    'pieceType': 'OFFICIAL',
                    'packageType': 'REGISTRY',
                }
                count++
                const result = isString ? JSON.stringify(step) : step
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [result, flowVersion.id],
                )
            }
        }
        log.info('MigrateWebhook1709581196563, migrated flows ' + count)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('rolling back MigrateWebhook1709581196563, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_version')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_version WHERE id = $1', [id])

            const step = parseJson(flowVersion.trigger)
            const isString = typeof flowVersion.trigger === 'string'
            if (step.type === 'PIECE_TRIGGER') {
                if (step.settings.pieceName === '@activepieces/piece-webhook') {
                    step.type = 'WEBHOOK'
                    step.settings = {
                        'inputUiInfo': step.settings.inputUiInfo,
                    }
                    count++
                    const result = isString ? JSON.stringify(step) : step
                    await queryRunner.query(
                        `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                        [result, flowVersion.id],
                    )
                }
            }
        }
        log.info(
            'rolling back  MigrateWebhook1709581196563, finished flows ' + count,
        )
    }
}


const parseJson = (json: string) => {
    try {
        return JSON.parse(json)
    }
    catch (e) {
        return json
    }
}
