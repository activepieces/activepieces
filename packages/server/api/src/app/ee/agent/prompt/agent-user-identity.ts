import { isNil } from '@activepieces/core-utils'
import { PersonalizationIdentity } from '../personalization/chat-personalization-service'

function fullName({ firstName, lastName }: { firstName: string, lastName: string }): string {
    return [firstName, lastName].map((part) => part.trim()).filter((part) => part.length > 0).join(' ')
}

function companyHintFromEmail({ email }: { email: string }): { domain: string, company: string } | null {
    const at = email.lastIndexOf('@')
    if (at < 0) {
        return null
    }
    const domain = email.slice(at + 1).toLowerCase().trim()
    if (domain.length === 0 || GENERIC_EMAIL_DOMAINS.has(domain)) {
        return null
    }
    const label = domain.split('.')[0]
    if (isNil(label) || label.length === 0) {
        return null
    }
    return { domain, company: label.charAt(0).toUpperCase() + label.slice(1) }
}

function buildUserIdentityNote({ firstName, lastName, email, platformName, identity }: {
    firstName: string
    lastName: string
    email: string
    platformName: string | null
    identity: PersonalizationIdentity | null
}): string {
    const name = fullName({ firstName, lastName })
    const lines = [
        '',
        '',
        '## Who you\'re talking to',
        name.length > 0
            ? `You're helping **${name}** (${email}). Use their first name when it feels natural.`
            : `You're helping the person at **${email}**.`,
    ]

    const company = identity?.company ?? null
    if (!isNil(company)) {
        lines.push(`- They work at **${company.name}**, ${company.description} (industry: ${company.industry}). This is researched, not a guess, so use it to ground your suggestions in their world.`)
    }
    else {
        const hint = companyHintFromEmail({ email })
        if (!isNil(hint)) {
            lines.push(`- Their email domain is **${hint.domain}**, so the company is likely **${hint.company}**. Treat this as a hint for grounding your help, and verify before stating it as fact.`)
        }
    }

    if (!isNil(identity?.role)) {
        lines.push(`- Their own role is **${identity.role}**, which they told us themselves. Pick examples and defaults that fit that role, and never attribute it to anyone else on their team.`)
    }

    if (!isNil(platformName)) {
        lines.push(`- The product they are using is branded **${platformName}**. Call it that, and never assume the name "Activepieces" in anything the user sees.`)
    }

    lines.push('- This is who "email me" refers to, and whose world your suggestions should fit.')

    return lines.join('\n')
}

const GENERIC_EMAIL_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk',
    'live.com', 'msn.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'icloud.com',
    'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'pm.me',
    'gmx.com', 'gmx.net', 'mail.com', 'zoho.com', 'yandex.com', 'yandex.ru',
    'fastmail.com', 'hey.com', 'tutanota.com', 'qq.com', '163.com', '126.com',
])

export const agentUserIdentity = {
    buildNote: buildUserIdentityNote,
    companyHintFromEmail,
}

export type UserIdentity = {
    firstName: string
    lastName: string
    email: string
    platformName: string | null
    identity: PersonalizationIdentity | null
}
