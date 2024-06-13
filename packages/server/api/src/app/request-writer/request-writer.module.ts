import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { requestWriterService } from './request-writer.service'
import { GenerateCodeRequest, GenerateCodeResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'

export const requestWriterModule: FastifyPluginAsyncTypebox = async () => {
    websocketService.addListener(WebsocketServerEvent.REQUEST_WRITE, (socket) => {
        return async (data: GenerateCodeRequest) => {
            const { prompt } = data
            const result = await requestWriterService.generateCode({ prompt })
            const response: GenerateCodeResponse = {
                result,
            }
            socket.emit(WebsocketClientEvent.REQUEST_WRITE_FINISHED, response)
        }
    })
}
