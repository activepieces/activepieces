import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddErrorHandlingOptionsToSteps1765362243294
implements MigrationInterface {
    name = 'AddErrorHandlingOptionsToSteps1765362243294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({ name: this.name }, 'up')

        const flowVersionIds = await queryRunner.query('SELECT id FROM flow_version')
        
        log.info(`AddErrorHandlingOptionsToSteps: found ${flowVersionIds.length} flow versions`)
        
        let processedFlows = 0
        let actuallyUpdatedFlows = 0
        
        for (const { id } of flowVersionIds) {
            const flowVersion = await queryRunner.query(
                'SELECT * FROM flow_version WHERE id = $1',
                [id],
            )
            
            if (flowVersion.length > 0) {
                const updated = traverseAndUpdateSubFlow(
                    addErrorHandlingOptionsToStep,
                    flowVersion[0].trigger,
                )
                
                if (updated) {
                    await queryRunner.query(
                        'UPDATE flow_version SET trigger = $1 WHERE id = $2',
                        [JSON.stringify(flowVersion[0].trigger), flowVersion[0].id],
                    )
                    actuallyUpdatedFlows++
                }
            }
            
            processedFlows++
            if (processedFlows % 100 === 0) {
                log.info(`AddErrorHandlingOptionsToSteps: processed ${processedFlows} flows, updated ${actuallyUpdatedFlows} so far`)
            }
        }

        log.info({ name: this.name }, `Migration completed: processed ${processedFlows} flows, updated ${actuallyUpdatedFlows}`)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No action needed
    }
}

const traverseAndUpdateSubFlow = (
    updater: (s: StepWithSettings) => boolean,
    root?: Step,
): boolean => {
    if (!root) {
        return false
    }

    let updated = false

    switch (root.type) {
        case 'PIECE':
        case 'CODE':
            if ('settings' in root) {
                updated = updater(root as StepWithSettings) || updated
            }
            break
        case 'LOOP_ON_ITEMS':
            updated = traverseAndUpdateSubFlow(updater, root.firstLoopAction) || updated
            break
        case 'ROUTER':
            if (root.children) {
                for (const child of root.children) {
                    if (child !== null) {
                        updated = traverseAndUpdateSubFlow(updater, child) || updated
                    }
                }
            }
            break
        default:
            break
    }

    updated = traverseAndUpdateSubFlow(updater, root.nextAction) || updated
    return updated
}

const addErrorHandlingOptionsToStep = (step: StepWithSettings): boolean => {
    if (!step.settings.errorHandlingOptions) {
        step.settings.errorHandlingOptions = {
            continueOnFailure: {
                value: false,
            },
            retryOnFailure: {
                value: false,
            },
        }
        return true
    }
    return false
}

type StepType =
  | 'CODE'
  | 'EMPTY'
  | 'LOOP_ON_ITEMS'
  | 'PIECE'
  | 'PIECE_TRIGGER'
  | 'ROUTER'

type BaseStep<T extends StepType> = {
    type: T
    nextAction?: Step
}

type LoopOnItemsStep = BaseStep<'LOOP_ON_ITEMS'> & {
    firstLoopAction?: Step
}

type RouterStep = BaseStep<'ROUTER'> & {
    children?: (Step | null)[]
}

type ErrorHandlingOptions = {
    continueOnFailure?: {
        value: boolean
    }
    retryOnFailure?: {
        value: boolean
    }
}

type StepWithSettings = BaseStep<'PIECE' | 'CODE'> & {
    settings: {
        errorHandlingOptions?: ErrorHandlingOptions
        [key: string]: unknown
    }
}

type GenericStep = BaseStep<'EMPTY' | 'PIECE_TRIGGER'>

type Step = LoopOnItemsStep | RouterStep | StepWithSettings | GenericStep
