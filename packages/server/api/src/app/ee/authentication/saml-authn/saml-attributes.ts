import { ActivepiecesError, ErrorCode, isNil, SAMLAttributeMapping } from '@activepieces/shared'

export const resolveSamlAttributes = ({ rawAttributes, mapping }: ResolveArgs): SamlAttributes => {
    const safeAttributes = rawAttributes ?? {}
    const candidates = buildCandidates(mapping)

    const email = pickAttribute({ rawAttributes: safeAttributes, candidates: candidates.email })
    const firstName = pickAttribute({ rawAttributes: safeAttributes, candidates: candidates.firstName })
    const lastName = pickAttribute({ rawAttributes: safeAttributes, candidates: candidates.lastName })

    if (isNil(email) || isNil(firstName) || isNil(lastName)) {
        const missing = collectMissing({ email, firstName, lastName })
        const receivedKeys = Object.keys(safeAttributes).join(', ')
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_SAML_RESPONSE,
            params: {
                message: `Invalid SAML response. Missing required field(s): ${missing.join(', ')}. Received attribute keys: [${receivedKeys}]. Configure attributeMapping in SSO settings if your IdP uses non-standard claim names.`,
            },
        })
    }

    return { email, firstName, lastName }
}

function buildCandidates(mapping: SAMLAttributeMapping | undefined): FieldCandidates {
    return {
        email: prepend(mapping?.email, DEFAULT_EMAIL_KEYS),
        firstName: prepend(mapping?.firstName, DEFAULT_FIRST_NAME_KEYS),
        lastName: prepend(mapping?.lastName, DEFAULT_LAST_NAME_KEYS),
    }
}

function prepend(override: string | undefined, defaults: string[]): string[] {
    if (isNil(override) || override.trim().length === 0) {
        return defaults
    }
    return [override, ...defaults]
}

function pickAttribute({ rawAttributes, candidates }: PickArgs): string | undefined {
    for (const key of candidates) {
        const value = readNonEmpty({ rawAttributes, key })
        if (!isNil(value)) {
            return value
        }
    }
    return undefined
}

function readNonEmpty({ rawAttributes, key }: ReadArgs): string | undefined {
    const value = rawAttributes[key]
    const flat = Array.isArray(value)
        ? value.find((entry) => typeof entry === 'string' && entry.length > 0)
        : value
    if (typeof flat === 'string' && flat.length > 0) {
        return flat
    }
    return undefined
}

function collectMissing({ email, firstName, lastName }: ResolvedTriple): string[] {
    const missing: string[] = []
    if (isNil(email)) {
        missing.push('email')
    }
    if (isNil(firstName)) {
        missing.push('firstName')
    }
    if (isNil(lastName)) {
        missing.push('lastName')
    }
    return missing
}

const DEFAULT_EMAIL_KEYS = [
    'email',
    'emailaddress',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
]

const DEFAULT_FIRST_NAME_KEYS = [
    'firstName',
    'firstname',
    'givenname',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
]

const DEFAULT_LAST_NAME_KEYS = [
    'lastName',
    'lastname',
    'surname',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
]

type RawAttributes = Record<string, unknown>

type ResolveArgs = {
    rawAttributes: RawAttributes | null | undefined
    mapping?: SAMLAttributeMapping
}

type PickArgs = {
    rawAttributes: RawAttributes
    candidates: string[]
}

type ReadArgs = {
    rawAttributes: RawAttributes
    key: string
}

type FieldCandidates = {
    email: string[]
    firstName: string[]
    lastName: string[]
}

type ResolvedTriple = {
    email: string | undefined
    firstName: string | undefined
    lastName: string | undefined
}

export type SamlAttributes = {
    email: string
    firstName: string
    lastName: string
}
