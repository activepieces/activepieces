import { z } from 'zod'

function readAttributionFromSearch({ search }: { search: string }): AttributionParams {
    const params = new URLSearchParams(search)
    return ATTRIBUTION_PARAM_KEYS.reduce<AttributionParams>((acc, key) => {
        const value = params.get(key)
        if (value !== null && value.trim().length > 0) {
            acc[key] = value.trim().slice(0, ATTRIBUTION_VALUE_MAX_LENGTH)
        }
        return acc
    }, {})
}

function isEmptyAttribution({ attribution }: { attribution: AttributionParams | undefined | null }): boolean {
    if (attribution === undefined || attribution === null) {
        return true
    }
    return ATTRIBUTION_PARAM_KEYS.every((key) => attribution[key] === undefined)
}

export const attributionUtils = {
    readAttributionFromSearch,
    isEmptyAttribution,
}

export const ATTRIBUTION_VALUE_MAX_LENGTH = 300

export const ATTRIBUTION_PARAM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'ref',
    'ap_cta',
    'ap_landing',
    'ap_referrer',
    'ap_sid',
] as const

export type AttributionParamKey = (typeof ATTRIBUTION_PARAM_KEYS)[number]

const attributionValue = z.string().trim().min(1).max(ATTRIBUTION_VALUE_MAX_LENGTH).optional()

export const AttributionParams = z.object({
    utm_source: attributionValue,
    utm_medium: attributionValue,
    utm_campaign: attributionValue,
    utm_term: attributionValue,
    utm_content: attributionValue,
    gclid: attributionValue,
    fbclid: attributionValue,
    ref: attributionValue,
    ap_cta: attributionValue,
    ap_landing: attributionValue,
    ap_referrer: attributionValue,
    ap_sid: attributionValue,
})

export type AttributionParams = z.infer<typeof AttributionParams>

export const ATTRIBUTION_STORAGE_KEY = 'ap_acquisition_params'

export const ATTRIBUTION_STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000

export enum SignUpMethod {
    PASSWORD = 'password',
    EMAIL_CODE = 'email_code',
    GOOGLE = 'google',
    SAML = 'saml',
    INVITATION = 'invitation',
    MANAGED = 'managed',
    UNKNOWN = 'unknown',
}

export enum DeploymentKind {
    CLOUD = 'cloud',
    SELF_HOSTED = 'self_hosted',
    DEV = 'dev',
}
