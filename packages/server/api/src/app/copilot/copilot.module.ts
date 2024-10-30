import { AskCopilotRequest, AskCopilotResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { copilotService } from './copilot.service'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const response: AskCopilotResponse | null = await copilotService.ask(request)
            socket.emit(WebsocketClientEvent.ASK_COPILOT_FINISHED, response)
        }
    })

    // TODO remove after testing
    app.post('/ask', AskCopilotRequestSchema, async (request) => {
        const response: AskCopilotResponse | null = await copilotService.ask(request.body)
        return response
    })

}


const AskCopilotRequestSchema = {
    schema: {
        body: AskCopilotRequest
    },
}