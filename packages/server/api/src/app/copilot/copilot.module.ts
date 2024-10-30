import { ALL_PRINCIPAL_TYPES, AskCopilotRequest, AskCopilotResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { copilotService } from './copilot.service'
import { httpGeneratorTool } from './tools/http-generate'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const response: AskCopilotResponse | null = await copilotService.ask(request)
            socket.emit(WebsocketClientEvent.ASK_COPILOT_FINISHED, response)
        }
    })

    // TODO remove after testing
    app.post('/ask', AskCopilotRequestSchema, async (request) => {
        return httpGeneratorTool.generateHttpRequest(request.body)
    })

}


const AskCopilotRequestSchema = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: AskCopilotRequest
    },
}