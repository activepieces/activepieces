import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const FLOW_VERSION_TABLE = 'flow_version'

const log = system.globalLogger()

export class ChangeVariableSyntax1683898241599 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('ChangeVariableSyntax1683898241599, started')
        const flowVersions = await queryRunner.query(
            `SELECT * FROM ${FLOW_VERSION_TABLE}`,
        )
        let count = 0
        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger
            const update = updateStep(step, true)
            if (update) {
                count++
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }
        log.info(
            `ChangeVariableSyntax1683898241599, updated ${count} flow versions`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('ChangeVariableSyntax1683898241599 down, started')
        const flowVersions = await queryRunner.query(
            `SELECT * FROM ${FLOW_VERSION_TABLE}`,
        )
        let count = 0
        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger
            const update = updateStep(step, false)
            if (update) {
                count++
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }
        log.info(
            `ChangeVariableSyntax1683898241599, down ${count} flow versions`,
        )
    }
}

type Step = {
    type: string
    settings: {
        input: unknown
    }
    nextAction?: Step
    onFailureAction?: Step
    onSuccessAction?: Step
    firstLoopAction?: Step
}

function updateStep(step: Step | undefined, forward: boolean): boolean {
    let update = false
    while (step) {
        if (step.settings.input) {
            step.settings.input = traverse(step.settings.input, forward)
            update = true
        }
        if (step.onSuccessAction) {
            const result = updateStep(step.onSuccessAction, forward)
            update = update || result
        }
        if (step.onFailureAction) {
            const result = updateStep(step.onFailureAction, forward)
            update = update || result
        }
        if (step.firstLoopAction) {
            const result = updateStep(step.firstLoopAction, forward)
            update = update || result
        }

        step = step.nextAction
    }
    return update
}

function traverse(input: unknown, forward: boolean): unknown {
    if (input === undefined || input === null) {
        return input
    }
    if (typeof input === 'string') {
        if (forward) {
            // Replace anything ${var.asd } to {{ var.asd }}
            return input.replace(/\$\{([^}]+)\}/g, '{{$1}}')
        }
        else {
            // Revert above change
            return input.replace(/\{\{([^}]+)\}\}/g, '${$1}')
        }
    }
    else if (Array.isArray(input)) {
        return input.map((item) => traverse(item, forward))
    }
    else if (typeof input === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(
            input as Record<string, unknown>,
        )) {
            result[key] = traverse(value, forward)
        }
        return result
    }
    return input
}
