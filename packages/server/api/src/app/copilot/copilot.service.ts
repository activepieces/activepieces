import { AskCopilotRequest, AskCopilotResponse } from '@activepieces/shared'
import { codeGeneratorTool } from './tools/code-generate'


export const copilotService = {
    async ask(request: AskCopilotRequest): Promise<AskCopilotResponse | null> {
        return codeGeneratorTool.generateCode(request)
    },

}
