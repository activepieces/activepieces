import { exceptionHandler } from '@activepieces/server-shared'
import { Action, ActionType, AskCopilotCodeResponse, AskCopilotRequest, flowStructureUtil, isNil, Trigger } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { generateCode } from './code-agent'

function createDefaultResponse(error?: string): AskCopilotCodeResponse {
    return {
        code: `export const code = async (inputs: Record<string, never>) => {
    throw new Error('${error || 'Failed to generate code. Please try again with a different prompt.'}');
    return { error: true };
}`,
        packageJson: {
            dependencies: {},
        },
        inputs: {},
        icon: 'AlertTriangle',
        title: 'Error: Code Generation Failed',
    }
}

function mergeInputs(copilotInputs: Record<string, string>, selectedStep: Action | Trigger | undefined): Record<string, string> {
    const mergedInputs: Record<string, string> = {}

    Object.entries(copilotInputs).forEach(([name, suggestedValue]) => {
        if (name && suggestedValue) {
            mergedInputs[name] = suggestedValue
        }
    })

    if (selectedStep?.type === ActionType.CODE) {
        Object.entries(selectedStep.settings.input).forEach(([key, value]) => {
            if (!isNil(value) && !isNil(mergedInputs[key])) {
                mergedInputs[key] = value
            }
        })
    }

    return mergedInputs
}

export const codeGeneratorTool = (log: FastifyBaseLogger) => ({
    async generateCode(projectId: string, request: AskCopilotRequest): Promise<AskCopilotCodeResponse> {
        try {
            const flowVersion = await flowService(log).getOnePopulatedOrThrow({
                id: request.flowId,
                versionId: request.flowVersionId,
                projectId,
            })
            const selectedStep = request.selectedStepName ? flowStructureUtil.getStep(request.selectedStepName, flowVersion.version.trigger) : undefined
        
            const copilotResponse = await generateCode(request.prompt, request.context)
            
            if (!copilotResponse?.code) {
                return createDefaultResponse('Code generation failed')
            }

            const mergedInputs = mergeInputs(copilotResponse.inputs, selectedStep)

            return {
                code: copilotResponse.code,
                packageJson: {
                    dependencies: {},
                },
                inputs: mergedInputs,
                icon: copilotResponse.icon ?? 'code',
                title: copilotResponse.title,
            }
        }
        catch (error) {
            exceptionHandler.handle(error, log)
            return createDefaultResponse(error instanceof Error ? error.message : 'Unknown error occurred')
        }
    },
})