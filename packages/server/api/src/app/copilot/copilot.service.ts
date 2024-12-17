import { AskCopilotRequest, AskCopilotResponse } from '@activepieces/shared'
import { codeGeneratorTool } from './tools/code/code-generate'


export const copilotService = {
    async ask(projectId: string, platformId: string, request: AskCopilotRequest): Promise<AskCopilotResponse | null> {
        return codeGeneratorTool.generateCode(projectId, platformId, request)
    },

}
