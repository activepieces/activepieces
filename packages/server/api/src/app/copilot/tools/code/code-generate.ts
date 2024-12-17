import { exceptionHandler } from '@activepieces/server-shared'
import { Action, ActionType, AskCopilotCodeResponse, AskCopilotRequest, flowStructureUtil, isNil, Trigger, ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowService } from '../../../flows/flow/flow.service'
import { generateCode } from './code-agent'

function createErrorResponse(error: string): AskCopilotCodeResponse {
    return {
        code: `export const code = async (inputs: Record<string, never>) => {
    throw new Error('${error}');
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

function createConfigurationResponse(): AskCopilotCodeResponse {
    return {
        code: '',
        packageJson: {
            dependencies: {},
        },
        inputs: {},
        icon: 'Settings',
        title: 'Configuration Required',
        textMessage: 'OpenAI service is not configured. Please check your platform settings.'
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

export const codeGeneratorTool = {
    async generateCode(projectId: string, platformId: string, request: AskCopilotRequest): Promise<AskCopilotCodeResponse> {
        try {
            const flowVersion = await flowService.getOnePopulatedOrThrow({
                id: request.flowId,
                versionId: request.flowVersionId,
                projectId,
            })
            const selectedStep = request.selectedStepName ? flowStructureUtil.getStep(request.selectedStepName, flowVersion.version.trigger) : undefined
        
            const copilotResponse = await generateCode(request.prompt, projectId, platformId, request.context)
            
            if (!copilotResponse?.code) {
                return createErrorResponse('Code generation failed')
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
            exceptionHandler.handle(error)
            console.log(error)  
            if (error instanceof ActivepiecesError && error.name === ErrorCode.OPEN_AI_FAILED) {
                return createConfigurationResponse()
            }
            return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred')
        }
    },
}