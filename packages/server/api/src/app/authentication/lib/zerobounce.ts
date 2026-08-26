import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'

const VALIDATE_URL = 'https://api.zerobounce.net/v2/validate'
const VALIDATE_TIMEOUT_SECONDS = 5
const REQUEST_TIMEOUT_MS = 7_000

const REFUSED_STATUSES = new Set(['spamtrap', 'abuse'])
const REFUSED_DO_NOT_MAIL_SUB_STATUSES = new Set(['disposable', 'toxic', 'possible_trap', 'global_suppression'])

function apiKey(): string | undefined {
    const raw = system.get(AppSystemProp.ZEROBOUNCE_API_KEY)?.trim()
    return isNil(raw) || raw.length === 0 ? undefined : raw
}

function domainOf(email: string): string {
    const at = email.lastIndexOf('@')
    return at < 0 ? '' : email.slice(at + 1).trim().toLowerCase().replace(/\.$/, '')
}

function reasonOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

function refusedBy(verdict: ValidateResponse): boolean {
    const status = verdict.status?.toLowerCase() ?? ''
    if (REFUSED_STATUSES.has(status)) {
        return true
    }
    return status === 'do_not_mail' && REFUSED_DO_NOT_MAIL_SUB_STATUSES.has(verdict.sub_status?.toLowerCase() ?? '')
}

async function isRefused({ email, log }: IsRefusedParams): Promise<boolean> {
    const key = apiKey()
    if (isNil(key)) {
        return false
    }
    const { data: response, error } = await tryCatch(() => safeHttp.axios.get<ValidateResponse>(VALIDATE_URL, {
        params: {
            api_key: key,
            email,
            timeout: VALIDATE_TIMEOUT_SECONDS,
        },
        timeout: REQUEST_TIMEOUT_MS,
    }))
    if (!isNil(error) || isNil(response)) {
        log.warn({ error: reasonOf(error) }, '[zerobounce#isRefused] the address could not be validated, letting it through')
        return false
    }
    if (!isNil(response.data.error)) {
        log.error({ error: response.data.error }, '[zerobounce#isRefused] zerobounce answered with an error, letting the address through: check the api key and the credit balance')
        return false
    }
    const refused = refusedBy(response.data)
    if (refused) {
        log.info({
            zerobounce: {
                domain: domainOf(email),
                status: response.data.status,
                subStatus: response.data.sub_status,
            },
        }, '[zerobounce#isRefused] address refused')
    }
    return refused
}

async function maySignUp({ email, log }: MaySignUpParams): Promise<boolean> {
    const refused = await isRefused({ email, log })
    if (!refused) {
        return true
    }
    return userInvitationsService(log).hasAnyAcceptedInvitationsForEmail({ email })
}

export const zerobounce = {
    isRefused,
    maySignUp,
}

type ValidateResponse = {
    status?: string
    sub_status?: string
    error?: string
}

type IsRefusedParams = {
    email: string
    log: FastifyBaseLogger
}

type MaySignUpParams = {
    email: string
    log: FastifyBaseLogger
}
