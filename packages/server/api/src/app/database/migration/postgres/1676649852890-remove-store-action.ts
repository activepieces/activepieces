import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class removeStoreAction1676649852890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Running migration removeStoreAction1676649852890')
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')
        let count = 0
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i]
            let action = currentFlowVersion.trigger?.nextAction
            let changed = false
            while (action !== undefined && action !== null) {
                if (action.type === 'STORAGE') {
                    action.type = 'PIECE'
                    const operation = action.settings.operation === 'GET' ? 'get' : 'put'
                    const key = action.settings.key
                    const value = action.settings.value
                    count++
                    action.settings = {
                        pieceName: 'storage',
                        actionName: operation,
                        input: {
                            key,
                            value,
                        },
                        inputUiInfo: {},
                    }
                    changed = true
                }
                action = action.nextAction
            }

            if (changed) {
                await queryRunner.query(
                    `UPDATE flow_version SET trigger = '${JSON.stringify(
                        currentFlowVersion.trigger,
                    )}' WHERE id = ${currentFlowVersion.id}`,
                )
            }
        }

        log.info(
            'Finished running migration removeStoreAction1676649852890, changed ' +
        count +
        ' actions',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i]
            let changed = false
            let action = currentFlowVersion.trigger?.nextAction
            while (action !== undefined && action !== null) {
                if (
                    action.type === 'PIECE' &&
          action.settings.pieceName === 'storage'
                ) {
                    action.type = 'STORAGE'
                    action.settings = {
                        operation: action.setings.operation.toUpperCase(),
                        key: action.settings.key,
                        value: action.settings.value,
                    }
                    changed = true
                }
                action = action.nextAction
            }
            if (changed) {
                await queryRunner.query(
                    `UPDATE flow_version SET trigger = '${JSON.stringify(
                        currentFlowVersion.trigger,
                    )}' WHERE id = ${currentFlowVersion.id}`,
                )
            }
        }
    }
}
