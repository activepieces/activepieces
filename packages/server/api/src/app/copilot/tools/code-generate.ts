import { AskCopilotCodeResponse, AskCopilotRequest } from '@activepieces/shared'
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

export const codeGeneratorTool = {
    async generateCode(
        request: AskCopilotRequest,
    ): Promise<AskCopilotCodeResponse> {
        try {
            const result = await generateCode(request.prompt)
            if (!result?.code) {
                return createDefaultResponse('Code generation failed')
            }

            const inputs: Record<string, string> = {}
            result.inputs?.forEach((input) => {
                if (input?.name && input?.suggestedValue) {
                    inputs[input.name] = input.suggestedValue
                }
            })

            return {
                code: result.code,
                packageJson: {
                    dependencies: {},
                },
                inputs,
                icon: 'Code2',
                title: 'Code Implementation',
            }
        }
        catch (error) {
            console.error('Code generation failed:', error)
            return createDefaultResponse(error instanceof Error ? error.message : 'Unknown error occurred')
        }
    },
}