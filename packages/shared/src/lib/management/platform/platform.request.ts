import { z } from 'zod'
import { SAFE_STRING_PATTERN } from '../../core/common'
import { Nullable, OptionalArrayFromQuery, OptionalBooleanFromQuery } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { ApMultipartFile } from '../../core/common/multipart-file'
import { tryCatchSync } from '../../core/common/try-catch'
import { FederatedAuthnProviderConfig } from '../../core/federated-authn'
import { FilteredPieceBehavior, PlatformThemeColors } from './platform.model'

export const MAX_EMBED_ORIGIN_LENGTH = 300

const ALLOWED_EMBED_ORIGIN_PROTOCOLS = new Set(['http:', 'https:'])
const WILDCARD_EMBED_ORIGIN_PATTERN = /^https?:\/\/\*\.[^*\s/?#]+$/

export const allowedEmbedOriginSchema = z.string()
    .max(MAX_EMBED_ORIGIN_LENGTH, 'invalidEmbedOrigin')
    .refine((value) => {
        const isWildcard = WILDCARD_EMBED_ORIGIN_PATTERN.test(value)
        const probe = isWildcard ? value.replace('://*.', '://wildcard.') : value
        try {
            const url = new URL(probe)
            return ALLOWED_EMBED_ORIGIN_PROTOCOLS.has(url.protocol) && url.origin === probe
        }
        catch {
            return false
        }
    }, 'invalidEmbedOrigin')

export const Base64EncodedFile = z.object({
    base64: z.string(),
    mimetype: z.string(),
})

export type Base64EncodedFile = z.infer<typeof Base64EncodedFile>

export const CreatePlatformRequest = z.object({
    name: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).min(1).max(100),
})

export type CreatePlatformRequest = z.infer<typeof CreatePlatformRequest>

// The branding form submits as multipart (logo uploads), where every field arrives as a string
const NullableThemeColorsFromMultipart = z.preprocess((value) => {
    if (typeof value !== 'string') {
        return value
    }
    const { data, error } = tryCatchSync<unknown>(() => JSON.parse(value))
    return error ? value : data
}, Nullable(PlatformThemeColors))

export const UpdatePlatformRequestBody = z.object({
    name: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).optional(),
    primaryColor: z.string().optional(),
    themeColors: NullableThemeColorsFromMultipart,
    logoIcon: ApMultipartFile.optional(),
    fullLogo: ApMultipartFile.optional(),
    favIcon: ApMultipartFile.optional(),
    filteredPieceNames: OptionalArrayFromQuery(z.string()),
    filteredPieceBehavior: z.nativeEnum(FilteredPieceBehavior).optional(),
    federatedAuthProviders: FederatedAuthnProviderConfig.optional(),
    cloudAuthEnabled: OptionalBooleanFromQuery,
    googleAuthEnabled: OptionalBooleanFromQuery,
    emailAuthEnabled: OptionalBooleanFromQuery,
    allowedAuthDomains: OptionalArrayFromQuery(z.string()),
    enforceAllowedAuthDomains: OptionalBooleanFromQuery,
    pinnedPieces: OptionalArrayFromQuery(z.string()),
    allowedEmbedOrigins: z.array(allowedEmbedOriginSchema)
        .optional(),
})

export type UpdatePlatformRequestBody = z.infer<typeof UpdatePlatformRequestBody>

export const AdminRetryRunsRequestBody = z.object({
    runIds: z.array(ApId).optional(),
    createdAfter: z.string(),
    createdBefore: z.string(),
})

export type AdminRetryRunsRequestBody = z.infer<typeof AdminRetryRunsRequestBody>

export const ApplyLicenseKeyByEmailRequestBody = z.object({
    email: z.string(),
    licenseKey: z.string(),
})

export type ApplyLicenseKeyByEmailRequestBody = z.infer<typeof ApplyLicenseKeyByEmailRequestBody>

export const IncreaseAICreditsForPlatformRequestBody = z.object({
    platformId: z.string(),
    amountInUsd: z.number(),
})

export type IncreaseAICreditsForPlatformRequestBody = z.infer<typeof IncreaseAICreditsForPlatformRequestBody>

export const AddAllowedEmbedOriginsRequestBody = z.object({
    allowedEmbedOrigins: z.array(allowedEmbedOriginSchema)
        .min(1, 'invalidEmbedOrigin'),
})

export type AddAllowedEmbedOriginsRequestBody = z.infer<typeof AddAllowedEmbedOriginsRequestBody>

export const AddAllowedEmbedOriginsResponse = z.object({
    allowedEmbedOrigins: z.array(z.string()),
})

export type AddAllowedEmbedOriginsResponse = z.infer<typeof AddAllowedEmbedOriginsResponse>
