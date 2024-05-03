import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class MigrateWebhookTemplate1709581196564 implements MigrationInterface {
    name = 'MigrateWebhookTemplate1709581196564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        logger.info('MigrateWebhookTemplate1709581196564, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_template')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_template WHERE id = $1', [id])
            const step = flowVersion.template.trigger
            if (step.type === 'WEBHOOK') {
                step.type = 'PIECE_TRIGGER'
                step.settings = {
                    input: {},
                    'inputUiInfo': step.settings.inputUiInfo,
                    triggerName: 'catch_request',
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.0.1',
                    'pieceType': 'OFFICIAL',
                    'packageType': 'REGISTRY',
                }
                count++
                const endResult = {
                    ...flowVersion.template,
                    trigger: step,
                }
                await queryRunner.query(
                    'UPDATE flow_template SET template = $1 WHERE id = $2',
                    [endResult, flowVersion.id],
                )
            }
        }
        logger.info('MigrateWebhookTemplate1709581196564, finished flows ' + count)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        logger.info('rolling back MigrateWebhookTemplate1709581196564, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_template')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_template WHERE id = $1', [id])

            const step = flowVersion.template.trigger
            if (step.type === 'PIECE_TRIGGER') {
                if (step.settings.pieceName === '@activepieces/piece-webhook') {
                    step.type = 'WEBHOOK'
                    step.settings = {
                        'inputUiInfo': step.settings.inputUiInfo,
                    }
                    count++
                    const endResult = {
                        ...flowVersion.template,
                        trigger: step,
                    }
                    await queryRunner.query(
                        'UPDATE flow_template SET template = $1 WHERE id = $2',
                        [endResult, flowVersion.id],
                    )
                }
            }
        }
        logger.info(
            'rolling back  MigrateWebhookTemplate1709581196564, finished flows ' + count,
        )
    }
}
