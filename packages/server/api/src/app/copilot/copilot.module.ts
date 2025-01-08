import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { AskCopilotRequest, AskCopilotResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { plannerAgent } from './agents/planner'
import { workflow } from './workflow'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const response: AskCopilotResponse | null = await workflow.handleRequest(request.id, request.prompts, request.currentWorkflow)
            socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
        }
    })
}

