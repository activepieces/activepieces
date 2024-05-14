import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { getTextContentFromUrl } from '../helper/web-scraper'
import { websocketService } from '../websockets/websockets.service'
import { copilotService } from './copilot.service'
import { GenerateCodeRequest, GenerateCodeResponse, GenerateHttpRequestDetailsRequest, GenerateHttpRequestDetailsResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'

export const copilotModule: FastifyPluginAsyncTypebox = async () => {
    websocketService.addListener(WebsocketServerEvent.GENERATE_CODE, (socket) => {
        return async (data: GenerateCodeRequest) => {
            const { prompt } = data
            const result = await copilotService.generateCode({ prompt })
            const response: GenerateCodeResponse = {
                result,
            }
            socket.emit(WebsocketClientEvent.GENERATE_CODE_FINISHED, response)
        }
    })
    websocketService.addListener(WebsocketServerEvent.GENERATE_HTTP_REQUEST_DETAILS, (socket) => {
        return async (data: GenerateHttpRequestDetailsRequest) => {
            const { prompt, docsUrl } = data
            let docsText
            if (docsUrl)  docsText = await getTextContentFromUrl({ url: docsUrl })
            const result = await copilotService.generateHttpRequestDetails({ prompt, docsText })
            const response: GenerateHttpRequestDetailsResponse = {
                result,
            }
            socket.emit(WebsocketClientEvent.GENERATE_HTTP_REQUEST_DETAILS_FINISHED, response)
        }
    })
}
