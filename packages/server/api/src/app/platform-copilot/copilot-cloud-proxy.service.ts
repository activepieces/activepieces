import { safeHttp } from '@activepieces/server-utils'
import { ApEdition, PlatformCopilotChatRequest, PlatformCopilotErrorCode, PlatformCopilotRegisterResponse } from '@activepieces/shared'
import { AxiosError, AxiosResponse } from 'axios'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../helper/system/system'
import { AppSystemProp, apVersionUtil } from '../helper/system/system-props'
import { platformCopilotCredentialsService } from './platform-copilot-credentials.service'

const buildCloudUrl = (path: string): string => {
    const base = system.getOrThrow(AppSystemProp.CLOUD_API_URL).replace(/\/$/, '')
    return `${base}${path}`
}

const registerWithCloud = async ({ platformId }: { platformId: string }): Promise<string> => {
    const version = await apVersionUtil.getCurrentRelease()
    const edition = system.getEdition()
    const response = await safeHttp.axios.post<PlatformCopilotRegisterResponse>(
        buildCloudUrl('/v1/platform-copilot/register'),
        { platformId, edition, version },
        { timeout: 15_000 },
    )
    const { copilotApiKey } = response.data
    await platformCopilotCredentialsService.saveApiKey({ platformId, copilotApiKey })
    return copilotApiKey
}

const ensureApiKey = async ({ platformId, force }: { platformId: string, force?: boolean }): Promise<string> => {
    if (!force) {
        const cached = await platformCopilotCredentialsService.getApiKey(platformId)
        if (cached) return cached
    }
    return registerWithCloud({ platformId })
}

const callCloudProxyChat = async ({ platformId, copilotApiKey, body }: {
    platformId: string
    copilotApiKey: string
    body: PlatformCopilotChatRequest
}): Promise<AxiosResponse> => {

    return safeHttp.axios.post(
        buildCloudUrl('/v1/platform-copilot/proxy-chat'),
        body,
        {
            headers: {
                Authorization: `Bearer ${copilotApiKey}`,
                'x-ap-platform-id': platformId,
            },
            responseType: 'stream',
            timeout: 120_000,
            validateStatus: () => true,
        },
    )
}

const pipeAxiosResponseToReply = (response: AxiosResponse, reply: FastifyReply): void => {
    reply.raw.statusCode = response.status
    const passthroughHeaders = ['content-type', 'cache-control', 'connection', 'x-vercel-ai-ui-message-stream']
    for (const header of passthroughHeaders) {
        const value = response.headers[header]
        if (value) reply.raw.setHeader(header, value)
    }
    response.data.pipe(reply.raw)
}

const respondJson = ({ reply, status, body }: { reply: FastifyReply, status: number, body: unknown }): void => {
    reply.raw.statusCode = status
    reply.raw.setHeader('content-type', 'application/json')
    reply.raw.end(JSON.stringify(body))
}

export const copilotCloudProxyService = {
    async forwardChat({ platformId, body, reply, log }: {
        platformId: string
        body: PlatformCopilotChatRequest
        reply: FastifyReply
        log: FastifyBaseLogger
    }): Promise<void> {
        void reply.hijack()
        try {
            let copilotApiKey = await ensureApiKey({ platformId })
            let response = await callCloudProxyChat({ platformId, copilotApiKey, body })

            if (response.status === StatusCodes.UNAUTHORIZED) {
                response.data?.destroy?.()
                copilotApiKey = await ensureApiKey({ platformId, force: true })
                response = await callCloudProxyChat({ platformId, copilotApiKey, body })
            }

            pipeAxiosResponseToReply(response, reply)
        }
        catch (error) {
            log.error({ err: error, platformId }, '[copilotCloudProxyService] failed to forward chat')
            const axiosError = error as AxiosError
            const status = axiosError.response?.status ?? StatusCodes.BAD_GATEWAY
            respondJson({
                reply,
                status: status >= 500 ? StatusCodes.BAD_GATEWAY : status,
                body: { error: PlatformCopilotErrorCode.COPILOT_UNREACHABLE },
            })
        }
    },

    async invalidateApiKey(platformId: string): Promise<void> {
        await platformCopilotCredentialsService.clear(platformId)
    },
}

export const isSelfHostedEdition = (): boolean => {
    return system.getEdition() !== ApEdition.CLOUD
}
