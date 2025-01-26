import { aiAgent } from '@activepieces/ai-agent'
import { AppSystemProp } from '@activepieces/server-shared'
import { AskCopilotRequest, AskCopilotResponse, CopilotSkill, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { system } from '../helper/system/system'
import { websocketService } from '../websockets/websockets.service'
import { actionAgent } from './agents/action'
import { plannerAgent } from './agents/planner'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    websocketService.addListener(WebsocketServerEvent.ASK_COPILOT, (socket) => {
        return async (request: AskCopilotRequest) => {
            const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)

            switch (request.skill) {
                case CopilotSkill.PLANNER: {
                    const response: AskCopilotResponse | null = await plannerAgent.run(request.id, request.prompts.map(p => p.content))
                    socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
                    break
                }
                case CopilotSkill.ACTION: {
                    await actionAgent(app.log).run(request, principal.projectId, (response) => {
                        socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
                    })
                    break
                }
                case CopilotSkill.AGENT: {
                    const apiKey = system.get(AppSystemProp.ANTHROPIC_API_KEY)
                    if (!apiKey) {
                        throw new Error('Anthropic API key is not set')
                    }
                    const res = await aiAgent.run(request.prompts, apiKey)
                    const response: AskCopilotResponse = {
                        type: 'agent',
                        response: res,
                    }
                    socket.emit(WebsocketClientEvent.ASK_COPILOT_RESPONSE, response)
                    break
                }
            }
        }
    })
}

