import { ErrorCode } from '@activepieces/core-utils'
import axios, { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it.each([500, 502, 503, 504, 520, 522, 524])('sends the single-use code once when the answer is %i, which can come after the code was used', async (status) => {
        secretsService.mockImplementation(secretsServiceReplies(status, ''))

        const claimFails = expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM, params: { pieceName: PIECE_NAME } },
        })
        await vi.runAllTimersAsync()
        await claimFails
        expect(secretsService).toHaveBeenCalledTimes(1)
    })

    it('sends the single-use code once when the secrets service does not answer in time', async () => {
        secretsService.mockRejectedValue(new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED))

        const claimFails = expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        await vi.runAllTimersAsync()
        await claimFails
        expect(secretsService).toHaveBeenCalledTimes(1)
    })

    it.each([521, 523, 525, 526])('retries when Cloudflare answers %i, which means the secrets service never got the code', async (status) => {
        secretsService
            .mockImplementationOnce(secretsServiceReplies(status, ''))
            .mockImplementationOnce(secretsServiceReplies(201, { access_token: 'access', refresh_token: 'refresh' }))

        const claim = claimGitlabCode()
        await vi.runAllTimersAsync()

        await expect(claim).resolves.toMatchObject({ access_token: 'access', refresh_token: 'refresh' })
        expect(secretsService).toHaveBeenCalledTimes(2)
        expect(secretsService.mock.calls[1][0].data).toBe(secretsService.mock.calls[0][0].data)
    })

    it('gives up after 3 attempts when Cloudflare keeps failing to reach the secrets service', async () => {
        secretsService.mockImplementation(secretsServiceReplies(521, ''))

        const claimFails = expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        await vi.runAllTimersAsync()
        await claimFails
        expect(secretsService).toHaveBeenCalledTimes(3)
        expect(log.error).toHaveBeenCalledWith(
            expect.objectContaining({ secretsService: { responseStatus: 521 } }),
            expect.any(String),
        )
    })

    it('stops retrying once the answer could come from the secrets service itself', async () => {
        secretsService
            .mockImplementationOnce(secretsServiceReplies(523, ''))
            .mockImplementationOnce(secretsServiceReplies(500, ''))

        const claimFails = expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        await vi.runAllTimersAsync()
        await claimFails
        expect(secretsService).toHaveBeenCalledTimes(2)
    })

    it('logs the status and the OAuth2 error the secrets service answered with', async () => {
        secretsService.mockImplementation(secretsServiceReplies(400, {
            error: 'invalid_grant',
            error_description: 'The provided authorization grant is invalid',
        }))

        await expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        expect(log.error).toHaveBeenCalledWith(
            expect.objectContaining({
                piece: { name: PIECE_NAME },
                secretsService: {
                    responseStatus: 400,
                    oauthError: 'invalid_grant',
                    oauthErrorDescription: 'The provided authorization grant is invalid',
                },
            }),
            expect.any(String),
        )
    })

    it('never logs the rest of the reply and caps the OAuth2 error fields', async () => {
        secretsService.mockImplementation(secretsServiceReplies(502, {
            error: 'server_error',
            error_description: 'x'.repeat(5000),
            access_token: 'leaked-access-token',
            code: 'leaked-code',
        }))

        await expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        const [fields] = vi.mocked(log.error).mock.calls[0]
        expect(fields).toMatchObject({
            secretsService: { responseStatus: 502, oauthError: 'server_error', oauthErrorDescription: 'x'.repeat(300) },
        })
        expect(JSON.stringify(fields)).not.toContain('leaked')
    })

    it('logs no reply fields when the secrets service does not answer', async () => {
        secretsService.mockRejectedValue(new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED))

        await expect(claimGitlabCode()).rejects.toMatchObject({
            error: { code: ErrorCode.INVALID_CLOUD_CLAIM },
        })
        expect(log.error).toHaveBeenCalledWith(
            expect.objectContaining({ secretsService: {} }),
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
