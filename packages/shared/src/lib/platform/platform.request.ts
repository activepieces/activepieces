import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { ApId } from '../common/id-generator'
import { FederatedAuthnProviderConfig } from '../federated-authn'
import { CopilotSettings, FilteredPieceBehavior, SMTPInformation } from './platform.model'

export const UpdatePlatformRequestBody = Type.Object({
    name: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    primaryColor: Type.Optional(Type.String()),
    logoIconUrl: Type.Optional(Type.String()),
    fullLogoUrl: Type.Optional(Type.String()),
    favIconUrl: Type.Optional(Type.String()),
    filteredPieceNames: Type.Optional(Type.Array(Type.String())),
    filteredPieceBehavior: Type.Optional(Type.Enum(FilteredPieceBehavior)),
    smtp: Type.Optional(Type.Union([SMTPInformation, Type.Null()])),
    federatedAuthProviders: Type.Optional(FederatedAuthnProviderConfig),
    cloudAuthEnabled: Type.Optional(Type.Boolean()),
    emailAuthEnabled: Type.Optional(Type.Boolean()),
    allowedAuthDomains: Type.Optional(Type.Array(Type.String())),
    enforceAllowedAuthDomains: Type.Optional(Type.Boolean()),
    pinnedPieces: Type.Optional(Type.Array(Type.String())),
    copilotSettings: Type.Optional(CopilotSettings),
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

export const GiftTrialByEmailRequestBody = Type.Object({
    gifts: Type.Array(Type.Object({
        email: Type.String(),
        trialPeriod: Type.Number(),
    })),
})
export type GiftTrialByEmailRequestBody = Static<typeof GiftTrialByEmailRequestBody>