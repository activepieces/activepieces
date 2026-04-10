import { z } from 'zod'
import { SAFE_STRING_PATTERN } from '../../core/common'
import { OptionalArrayFromQuery, OptionalBooleanFromQuery } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { ApMultipartFile } from '../../core/common/multipart-file'
import { FederatedAuthnProviderConfig } from '../../core/federated-authn'
import { FilteredPieceBehavior } from './platform.model'

export const Base64EncodedFile = z.object({
    base64: z.string(),
    mimetype: z.string(),
})

export type Base64EncodedFile = z.infer<typeof Base64EncodedFile>

export const UpdatePlatformRequestBody = z.object({
    name: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).optional(),
    primaryColor: z.string().optional(),
    logoIcon: ApMultipartFile.optional(),
    fullLogo: ApMultipartFile.optional(),
    favIcon: ApMultipartFile.optional(),
    filteredPieceNames: OptionalArrayFromQuery(z.string()),
    filteredPieceBehavior: z.nativeEnum(FilteredPieceBehavior).optional(),
    federatedAuthProviders: FederatedAuthnProviderConfig.optional(),
    cloudAuthEnabled: OptionalBooleanFromQuery,
    emailAuthEnabled: OptionalBooleanFromQuery,
    allowedAuthDomains: OptionalArrayFromQuery(z.string()),
    enforceAllowedAuthDomains: OptionalBooleanFromQuery,
    pinnedPieces: OptionalArrayFromQuery(z.string()),
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

export const UpsertConcurrencyPoolRequestBody = z.object({
    platformId: ApId,
    projectIds: z.array(ApId).min(1),
    maxConcurrentJobs: z.number().int().positive(),
})

export type UpsertConcurrencyPoolRequestBody = z.infer<typeof UpsertConcurrencyPoolRequestBody>
