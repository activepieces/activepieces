import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddErrorHandlingOptionsToTemplateSteps1765362243295
implements MigrationInterface {
    name = 'AddErrorHandlingOptionsToTemplateSteps1765362243295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({ name: this.name }, 'up')

        const doesTableExist = await queryRunner.hasTable('flow_template')
        
        if (!doesTableExist) {
            log.info({ name: this.name }, 'flow_template table does not exist, skipping')
            return
        }

        const connection = queryRunner.connection
        const templates = await connection.query('SELECT * FROM flow_template')
        
        log.info(`AddErrorHandlingOptionsToTemplateSteps: found ${templates.length} flow templates`)
        
        let processedTemplates = 0
        let actuallyUpdatedTemplates = 0
        
        for (const template of templates) {
            const updated = traverseAndUpdateSubFlow(
                addErrorHandlingOptionsToStep,
                template.template.trigger,
            )
            
            if (updated) {
                await connection.query(
                    'UPDATE flow_template SET template = $1 WHERE id = $2',
                    [JSON.stringify(template.template), template.id],
                )
                actuallyUpdatedTemplates++
            }
            
            processedTemplates++
        }
        
        log.info({ name: this.name }, `Migration completed: processed ${processedTemplates} templates, updated ${actuallyUpdatedTemplates}`)
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
