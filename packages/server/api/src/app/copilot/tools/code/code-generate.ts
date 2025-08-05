import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AskCopilotCodeResponse,
    AskCopilotRequest,
    ErrorCode,
    FlowAction,
    FlowActionType,
    flowStructureUtil,
    FlowTrigger,
    isNil,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { generateCode } from './code-agent'

function createErrorResponse(error: string, isConfigError = false): AskCopilotCodeResponse {
    return {
        code: `export const code = async (inputs: Record<string, never>) => {
    throw new Error('${error}')
    return { error: true }
}`,
        packageJson: { dependencies: {} },
        inputs: {},
        icon: isConfigError ? 'Settings' : 'AlertTriangle',
        title: isConfigError ? 'Configuration Required' : 'Error: Code Generation Failed',
        textMessage: isConfigError ? error : undefined,
    }
}

function mergeInputs(
    copilotInputs: Record<string, string>,
    selectedStep: FlowAction | FlowTrigger | undefined,
): Record<string, string> { 
    const mergedInputs: Record<string, string> = {}

    Object.entries(copilotInputs).forEach(([name, suggestedValue]) => {
        if (name && suggestedValue) {
            mergedInputs[name] = suggestedValue
        }
    })

    if (selectedStep?.type === FlowActionType.CODE) {
        Object.entries(selectedStep.settings.input).forEach(([key, value]) => {
            if (!isNil(value) && !isNil(mergedInputs[key])) {
                mergedInputs[key] = value
            }
        })
    }

    return mergedInputs
}

export const codeGeneratorTool = (log: FastifyBaseLogger) => ({
    async generateCode(projectId: string, platformId: string, request: AskCopilotRequest): Promise<AskCopilotCodeResponse> {
        try {
            const flowVersion = await flowService(log).getOnePopulatedOrThrow({
                id: request.flowId,
                versionId: request.flowVersionId,
                projectId,
            })

            const selectedStep = request.selectedStepName
                ? flowStructureUtil.getStep(request.selectedStepName, flowVersion.version.trigger)
                : undefined

            const copilotResponse = await generateCode(
                request.prompt,
                platformId,
                request.context,
                log,
            )

            return {
                code: copilotResponse.code,
                packageJson: { dependencies: {} },
                inputs: mergeInputs(copilotResponse.inputs, selectedStep),
                icon: copilotResponse.icon ?? 'code',
                title: copilotResponse.title,
            }
        }
        catch (error) {
            exceptionHandler.handle(error, log)
            if (error instanceof ActivepiecesError && error.error.code === ErrorCode.COPILOT_FAILED) {
                const message = error?.error?.params?.message || 'Copilot service is not configured. Please check your platform settings.'
                return createErrorResponse(message, true)
            }

            return createErrorResponse(
                error instanceof Error ? error.message : 'Unknown error occurred',
            )
        }
    },
})