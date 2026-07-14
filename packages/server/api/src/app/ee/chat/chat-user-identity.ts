// Free/consumer email providers whose domain says nothing about the user's company —
// never derive a "likely company" hint from these.
const GENERIC_EMAIL_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk',
    'live.com', 'msn.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'icloud.com',
    'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'pm.me',
    'gmx.com', 'gmx.net', 'mail.com', 'zoho.com', 'yandex.com', 'yandex.ru',
    'fastmail.com', 'hey.com', 'tutanota.com', 'qq.com', '163.com', '126.com',
])

function fullName({ firstName, lastName }: { firstName: string, lastName: string }): string {
    return [firstName, lastName].map((part) => part.trim()).filter((part) => part.length > 0).join(' ')
}

// A best-effort guess at the user's company from their email domain — only when it's a
// real corporate domain. The label is capitalised for readability ("activepieces.com" →
// "Activepieces"); the model is told to treat it as a hint and verify before stating it.
function companyHintFromEmail(email: string): { domain: string, company: string } | null {
    const at = email.lastIndexOf('@')
    if (at < 0) {
        return null
    }
    const domain = email.slice(at + 1).toLowerCase().trim()
    if (domain.length === 0 || GENERIC_EMAIL_DOMAINS.has(domain)) {
        return null
    }
    const label = domain.split('.')[0]
    if (!label || label.length === 0) {
        return null
    }
    return { domain, company: label.charAt(0).toUpperCase() + label.slice(1) }
}

// A short "who you're talking to" block injected into the system prompt so the agent
// knows the real person behind the conversation — their name (to address them and to
// personalise), their email (the "email me" destination), a company hint from the email
// domain, and the platform's white-label brand name (so it never assumes "Activepieces").
// Mirrors chat-account-overview's buildNote style.
function buildUserIdentityNote({ firstName, lastName, email, platformName }: {
    firstName: string
    lastName: string
    email: string
    platformName: string | null
}): string {
    const name = fullName({ firstName, lastName })
    const lines: string[] = ['\n\n## Who you\'re talking to']
    lines.push(name.length > 0
        ? `You're helping **${name}** (${email}). Use their first name when it feels natural.`
        : `You're helping the person at **${email}**.`)

    const hint = companyHintFromEmail(email)
    if (hint) {
        lines.push(`- Their email domain is **${hint.domain}** — likely the company **${hint.company}**. Treat this as a hint to ground your help (their industry, their goals, sensible defaults); verify before stating it as fact.`)
    }

    if (platformName) {
        lines.push(`- The product they're using is branded **${platformName}** — call it that, and never assume the name "Activepieces" in anything the user sees.`)
    }

    lines.push('- This is who "email me" refers to, and whose world your suggestions should fit.')

    return lines.join('\n')
}

export const chatUserIdentity = {
    buildNote: buildUserIdentityNote,
    companyHintFromEmail,
}
