import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { AskCopilotRequest, AskCopilotResponse, CopilotSkill, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { plannerAgent } from './agents/planner'
import { actionAgent } from './agents/action'
import { accessTokenManager } from '../authentication/lib/access-token-manager'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)

            switch (request.skill) {
                case CopilotSkill.PLANNER: {
                    const response: AskCopilotResponse | null = await plannerAgent.run(request.id, request.prompts)
                    socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
                    break
                }
                case CopilotSkill.ACTION: {
                    await actionAgent(app.log).run(request, principal.projectId, (response) => {
                        socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
                    })
                    break
                }
            }
        }
    })
}

