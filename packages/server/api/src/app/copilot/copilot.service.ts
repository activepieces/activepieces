import { AskCopilotRequest, AskCopilotResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { codeGeneratorTool } from './tools/code/code-generate'
import { httpGeneratorTool } from './tools/http/http-generate'

export const copilotService = (log: FastifyBaseLogger) => ({
    async ask(projectId: string, platformId: string, request: AskCopilotRequest): Promise<AskCopilotResponse | null> {
        return codeGeneratorTool(log).generateCode(projectId, platformId, request)
    },

    async askHttp(request: AskCopilotRequest) {
        return httpGeneratorTool.generateHttpRequest(request)
    },
})
