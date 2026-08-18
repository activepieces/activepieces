import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import disposableDomains from 'disposable-email-domains'
import wildcardDomains from 'disposable-email-domains/wildcard.json'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'

const exactDomains = new Set<string>(disposableDomains)
const suffixDomains: string[] = wildcardDomains

function domainOf(email: string): string {
    const at = email.lastIndexOf('@')
    return at < 0 ? '' : email.slice(at + 1).trim().toLowerCase().replace(/\.$/, '')
}

function isDisposable(email: string): boolean {
    const domain = domainOf(email)
    if (domain.length === 0) {
        return false
    }
    if (exactDomains.has(domain)) {
        return true
    }
    return suffixDomains.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`))
}

async function assertMaySignUp({ email, log }: AssertMaySignUpParams): Promise<void> {
    if (system.getBoolean(AppSystemProp.ALLOW_DISPOSABLE_EMAILS)) {
        return
    }
    if (!isDisposable(email)) {
        return
    }
    const invited = await userInvitationsService(log).hasAnyAcceptedInvitationsForEmail({ email })
    if (invited) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.DOMAIN_NOT_ALLOWED,
        params: {
            domain: domainOf(email),
        },
    })
}

export const disposableEmail = {
    isDisposable,
    assertMaySignUp,
}

type AssertMaySignUpParams = {
    email: string
    log: FastifyBaseLogger
}
