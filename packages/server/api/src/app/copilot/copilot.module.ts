import { exceptionHandler } from '@activepieces/server-shared'
import { GenerateCodeRequest, GenerateCodeResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { copilotService } from './copilot.service'

export const copilotModule: FastifyPluginAsyncTypebox = async () => {
    websocketService.addListener(WebsocketServerEvent.GENERATE_CODE, (socket) => {
        return async (data: GenerateCodeRequest) => {
            try {
                const { prompt, previousContext } = data
                const response: GenerateCodeResponse = await copilotService.generateCode({ prompt, previousContext })
                socket.emit(WebsocketClientEvent.GENERATE_CODE_FINISHED, response)
            }
            catch (error) {
                exceptionHandler.handle(error)
            }
        }
    })
}
