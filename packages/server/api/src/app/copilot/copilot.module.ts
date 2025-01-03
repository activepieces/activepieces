import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { AskCopilotRequest, CopilotFlowPlanResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { plannerAgent } from './agents/planner'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            
            app.log.info({
                id: request,
            }, 'Ask Copilot Request')

            const response: CopilotFlowPlanResponse | null = await plannerAgent.run(request.prompts)
            socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, {
                ...response,
                id: request.id,
            })
        }
    })
}

