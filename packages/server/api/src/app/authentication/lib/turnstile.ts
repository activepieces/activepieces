import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const VERIFY_TIMEOUT_MS = 5_000

function configuredValue(prop: AppSystemProp): string | undefined {
    const raw = system.get(prop)?.trim()
    return isNil(raw) || raw.length === 0 ? undefined : raw
}

function siteKey(): string | undefined {
    return isConfigured() ? configuredValue(AppSystemProp.TURNSTILE_SITE_KEY) : undefined
}

function isConfigured(): boolean {
    return !isNil(configuredValue(AppSystemProp.TURNSTILE_SITE_KEY))
        && !isNil(configuredValue(AppSystemProp.TURNSTILE_SECRET_KEY))
}

function siteVerifyAnswered(error: unknown): boolean {
    return isAxiosError(error) && !isNil(error.response)
}

function rejected(): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: 'captchaVerificationFailed',
        },
    })
}

async function assertSolved({ token, remoteIp, log }: AssertSolvedParams): Promise<void> {
    if (!isConfigured()) {
        return
    }
    if (isNil(token) || token.length === 0) {
        throw rejected()
    }
    const body = new URLSearchParams({
        secret: configuredValue(AppSystemProp.TURNSTILE_SECRET_KEY) ?? '',
        response: token,
        ...(isNil(remoteIp) ? {} : { remoteip: remoteIp }),
    })
    const { data: response, error } = await tryCatch(() => safeHttp.axios.post<SiteVerifyResponse>(
        VERIFY_URL,
        body.toString(),
        {
            timeout: VERIFY_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
    ))
    if (!isNil(error)) {
        if (siteVerifyAnswered(error)) {
            log.warn({ error }, '[turnstile#assertSolved] siteverify answered with an error status, refusing')
            throw rejected()
        }
        log.warn({ error }, '[turnstile#assertSolved] challenge could not be verified, allowing the request through')
        return
    }
    if (isNil(response)) {
        log.warn('[turnstile#assertSolved] challenge could not be verified, allowing the request through')
        return
    }
    if (!response.data.success) {
        log.warn({ errors: response.data['error-codes'] }, '[turnstile#assertSolved] challenge rejected')
        throw rejected()
    }
}

export const turnstile = {
    isConfigured,
    siteKey,
    assertSolved,
}

type SiteVerifyResponse = {
    success: boolean
    'error-codes'?: string[]
}

type AssertSolvedParams = {
    token: string | undefined
    remoteIp: string | undefined
    log: FastifyBaseLogger
}
