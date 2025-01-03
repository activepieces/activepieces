import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { AskCopilotRequest, AskCopilotResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { plannerAgent } from './agents/planner'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const response: AskCopilotResponse | null = await plannerAgent.run(request.id, request.prompts)
            socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
        }
    })
}

