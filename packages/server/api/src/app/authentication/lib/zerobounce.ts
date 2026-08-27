import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'

const VALIDATE_URL = 'https://api.zerobounce.net/v2/validate'
const VALIDATE_TIMEOUT_SECONDS = 5
const REQUEST_TIMEOUT_MS = 7_000

const DISPOSABLE_DOMAIN_TTL_SECONDS = 90 * 24 * 60 * 60

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

function disposableDomainKey(domain: string): string {
    return `zerobounce:disposable-domain:v1:${domain}`
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

function isDisposableVerdict(verdict: ValidateResponse): boolean {
    return verdict.status?.toLowerCase() === 'do_not_mail' && verdict.sub_status?.toLowerCase() === 'disposable'
}

async function cachedDisposableDomain({ domain, log }: CachedDisposableDomainParams): Promise<boolean> {
    if (domain.length === 0) {
        return false
    }
    const { data: cached, error } = await tryCatch(() => distributedStore.get<boolean>(disposableDomainKey(domain)))
    if (!isNil(error)) {
        log.warn({ error: reasonOf(error) }, '[zerobounce#cachedDisposableDomain] the cache could not be read, asking zerobounce')
        return false
    }
    return cached === true
}

async function rememberDisposableDomain({ domain, log }: RememberDisposableDomainParams): Promise<void> {
    if (domain.length === 0) {
        return
    }
    const { error } = await tryCatch(() => distributedStore.put(disposableDomainKey(domain), true, DISPOSABLE_DOMAIN_TTL_SECONDS))
    if (!isNil(error)) {
        log.warn({ error: reasonOf(error) }, '[zerobounce#rememberDisposableDomain] the verdict could not be cached, the next attempt will spend a credit')
    }
}

async function refuses({ email, log }: RefusesParams): Promise<boolean> {
    const key = apiKey()
    if (isNil(key)) {
        return false
    }
    const domain = domainOf(email)
    const known = await cachedDisposableDomain({ domain, log })
    if (known) {
        log.info({ zerobounce: { domain, source: 'cache' } }, '[zerobounce#refuses] address refused')
        return true
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
        log.warn({ error: reasonOf(error) }, '[zerobounce#refuses] the address could not be validated, letting it through')
        return false
    }
    if (!isNil(response.data.error)) {
        log.error({ error: response.data.error }, '[zerobounce#refuses] zerobounce answered with an error, letting the address through: check the api key and the credit balance')
        return false
    }
    if (isDisposableVerdict(response.data)) {
        await rememberDisposableDomain({ domain, log })
    }
    const refused = refusedBy(response.data)
    if (refused) {
        log.info({
            zerobounce: {
                domain,
                status: response.data.status,
                subStatus: response.data.sub_status,
                source: 'zerobounce',
            },
        }, '[zerobounce#refuses] address refused')
    }
    return refused
}

async function maySignUp({ email, log }: MaySignUpParams): Promise<boolean> {
    const refused = await refuses({ email, log })
    if (!refused) {
        return true
    }
    return userInvitationsService(log).hasAnyAcceptedInvitationsForEmail({ email })
}

export const zerobounce = {
    maySignUp,
}

type ValidateResponse = {
    status?: string
    sub_status?: string
    error?: string
}

type CachedDisposableDomainParams = {
    domain: string
    log: FastifyBaseLogger
}

type RememberDisposableDomainParams = {
    domain: string
    log: FastifyBaseLogger
}

type RefusesParams = {
    email: string
    log: FastifyBaseLogger
}

type MaySignUpParams = {
    email: string
    log: FastifyBaseLogger
}
