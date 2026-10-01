import { ErrorCode } from '@activepieces/core-utils'
import axios, { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudOAuth2Service } from '../../../../src/app/app-connection/app-connection-service/oauth2/services/cloud-oauth2-service'

const PIECE_NAME = '@activepieces/piece-gitlab'

const secretsService = vi.fn<(config: InternalAxiosRequestConfig) => Promise<AxiosResponse>>()
axios.defaults.adapter = (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => secretsService(config)

const log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger

function claimGitlabCode(): Promise<unknown> {
    return cloudOAuth2Service(log).claim({
        projectId: 'project-id',
        platformId: 'platform-id',
        pieceName: PIECE_NAME,
        request: {
            code: 'single-use-code',
            clientId: 'gitlab-client-id',
            tokenUrl: 'https://gitlab.com/oauth/token',
            props: {},
        },
    })
}

function secretsServiceReplies(status: number, data: unknown): (config: InternalAxiosRequestConfig) => Promise<AxiosResponse> {
    return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
        const response = { status, statusText: String(status), data, headers: new AxiosHeaders(), config }
        if (status >= 400) {
            throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, undefined, response)
        }
        return response
    }
}

describe('cloudOAuth2Service.claim', () => {
    beforeEach(() => {
        secretsService.mockReset()
        vi.mocked(log.error).mockReset()
    })

    it('sends the single-use code to the secrets service once when it answers 500', async () => {
        secretsService.mockImplementation(secretsServiceReplies(500, ''))

        await expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM, params: { pieceName: PIECE_NAME } },
        })
        expect(secretsService).toHaveBeenCalledTimes(1)
    })

    it('logs the status and body the secrets service answered with', async () => {
        const providerError = { error: 'invalid_grant', error_description: 'The provided authorization grant is invalid' }
        secretsService.mockImplementation(secretsServiceReplies(400, providerError))

        await expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        expect(log.error).toHaveBeenCalledWith(
            expect.objectContaining({
                piece: { name: PIECE_NAME },
                secretsService: { responseStatus: 400, responseBody: providerError },
            }),
            expect.any(String),
        )
    })

    it('returns the claimed tokens with the token url and props', async () => {
        secretsService.mockImplementation(secretsServiceReplies(201, { access_token: 'access', refresh_token: 'refresh' }))

        await expect(claimGitlabCode()).resolves.toMatchObject({
            access_token: 'access',
            refresh_token: 'refresh',
            token_url: 'https://gitlab.com/oauth/token',
            props: {},
        })
        expect(secretsService).toHaveBeenCalledTimes(1)
        expect(secretsService.mock.calls[0][0].url).toBe('https://secrets.activepieces.com/claim')
    })
})
