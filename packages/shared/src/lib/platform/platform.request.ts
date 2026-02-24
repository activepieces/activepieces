import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { ApId } from '../common/id-generator'
import { ApMultipartFile } from '../common/multipart-file'
import { FederatedAuthnProviderConfig } from '../federated-authn'
import { FilteredPieceBehavior } from './platform.model'

export const Base64EncodedFile = Type.Object({
    base64: Type.String(),
    mimetype: Type.String(),
})

export type Base64EncodedFile = Static<typeof Base64EncodedFile>

export const UpdatePlatformRequestBody = Type.Object({
    name: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    primaryColor: Type.Optional(Type.String()),
    logoIcon: Type.Optional(ApMultipartFile),
    fullLogo: Type.Optional(ApMultipartFile),
    favIcon: Type.Optional(ApMultipartFile),
    filteredPieceNames: Type.Optional(Type.Array(Type.String())),
    filteredPieceBehavior: Type.Optional(Type.Enum(FilteredPieceBehavior)),
    federatedAuthProviders: Type.Optional(FederatedAuthnProviderConfig),
    cloudAuthEnabled: Type.Optional(Type.Boolean()),
    emailAuthEnabled: Type.Optional(Type.Boolean()),
    allowedAuthDomains: Type.Optional(Type.Array(Type.String())),
    enforceAllowedAuthDomains: Type.Optional(Type.Boolean()),
    pinnedPieces: Type.Optional(Type.Array(Type.String())),
})

export type UpdatePlatformRequestBody = Static<typeof UpdatePlatformRequestBody>

export const AdminRetryRunsRequestBody = Type.Object({
    runIds: Type.Optional(Type.Array(ApId)),
    createdAfter: Type.String(),
    createdBefore: Type.String(),
})

export type AdminRetryRunsRequestBody = Static<typeof AdminRetryRunsRequestBody>

export const ApplyLicenseKeyByEmailRequestBody = Type.Object({
    email: Type.String(),
    licenseKey: Type.String(),
})

export type ApplyLicenseKeyByEmailRequestBody = Static<typeof ApplyLicenseKeyByEmailRequestBody>

export const IncreaseAICreditsForPlatformRequestBody = Type.Object({
    platformId: Type.String(),
    amountInUsd: Type.Number(),
})

export type IncreaseAICreditsForPlatformRequestBody = Static<typeof IncreaseAICreditsForPlatformRequestBody>