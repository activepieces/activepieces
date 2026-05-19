import { FastifyBaseLogger } from 'fastify'
import { chatToolCategories } from './tools/chat-tool-categories'

function createPrepareStep({ log }: CreatePrepareStepParams) {
    return ({ stepNumber, steps }: { stepNumber: number, steps: ReadonlyArray<StepData> }): PrepareStepReturn => {
        log.debug({ stepNumber, stepCount: steps.length }, 'Chat step')

        if (steps.length > 0) {
            const lastStep = steps[steps.length - 1]
            const lastWasMutation = lastStep.toolCalls.some(
                (tc) => chatToolCategories.isMutationTool(tc.toolName),
            )
            const hadValidation = lastStep.toolCalls.some(
                (tc) => tc.toolName === 'ap_validate_step_config',
            )
            if (lastWasMutation && !hadValidation) {
                return { activeTools: chatToolCategories.VALIDATION_TOOL_NAMES }
            }
        }

        return undefined
    }
}

type StepData = {
    readonly toolCalls: ReadonlyArray<{ readonly toolName: string }>
    readonly text: string
}

type PrepareStepReturn = {
    activeTools?: string[]
} | undefined

type CreatePrepareStepParams = {
    log: FastifyBaseLogger
}

export const chatPrepareStep = {
    createPrepareStep,
}
