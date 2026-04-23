import { ActivepiecesError, ErrorCode, isNil, SAMLAttributeMapping } from '@activepieces/shared'

export const resolveSamlAttributes = ({ rawAttributes, mapping }: ResolveArgs): SamlAttributes => {
    const safeAttributes = rawAttributes ?? {}
    const email = pickFirstValue({ source: safeAttributes, keys: candidatesFor({ field: 'email', mapping }) })
    const firstName = pickFirstValue({ source: safeAttributes, keys: candidatesFor({ field: 'firstName', mapping }) })
    const lastName = pickFirstValue({ source: safeAttributes, keys: candidatesFor({ field: 'lastName', mapping }) })
    if (isNil(email) || isNil(firstName) || isNil(lastName)) {
        throw missingFieldsError({
            resolved: { email, firstName, lastName },
            receivedKeys: Object.keys(safeAttributes),
        })
    }
    return { email, firstName, lastName }
}

function candidatesFor({ field, mapping }: CandidatesArgs): string[] {
    const override = mapping?.[field]?.trim()
    return isNil(override) || override.length === 0
        ? DEFAULT_KEYS[field]
        : [override, ...DEFAULT_KEYS[field]]
}

function pickFirstValue({ source, keys }: PickArgs): string | undefined {
    return keys.map((key) => unwrap(source[key])).find(isNonEmptyString)
}

function unwrap(value: unknown): unknown {
    return Array.isArray(value) ? value.find(isNonEmptyString) : value
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
}

function missingFieldsError({ resolved, receivedKeys }: MissingFieldsErrorArgs): ActivepiecesError {
    const missing: string[] = []
    if (isNil(resolved.email)) {
        missing.push('email')
    }
    if (isNil(resolved.firstName)) {
        missing.push('firstName')
    }
    if (isNil(resolved.lastName)) {
        missing.push('lastName')
    }
    return new ActivepiecesError({
        code: ErrorCode.INVALID_SAML_RESPONSE,
        params: {
            message: `Invalid SAML response. Missing required field(s): ${missing.join(', ')}. Received attribute keys: [${receivedKeys.join(', ')}]. Configure attributeMapping in SSO settings if your IdP uses non-standard claim names.`,
        },
    })
}

const DEFAULT_KEYS: Record<keyof SamlAttributes, string[]> = {
    email: [
        'email',
        'emailaddress',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    ],
    firstName: [
        'firstName',
        'firstname',
        'givenname',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    ],
    lastName: [
        'lastName',
        'lastname',
        'surname',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    ],
}

type ResolveArgs = {
    rawAttributes: Record<string, unknown> | null | undefined
    mapping?: SAMLAttributeMapping
}

type CandidatesArgs = {
    field: keyof SamlAttributes
    mapping: SAMLAttributeMapping | undefined
}

type PickArgs = {
    source: Record<string, unknown>
    keys: string[]
}

type MissingFieldsErrorArgs = {
    resolved: Partial<SamlAttributes>
    receivedKeys: string[]
}

export type SamlAttributes = {
    email: string
    firstName: string
    lastName: string
}
