import { Type, Static } from '@sinclair/typebox'
import { FilteredPieceBehavior } from './platform.model'
import { FederatedAuthnProviderConfig } from '../federated-authn'
import { LocalesEnum } from '../common'
import { ApId } from '../common/id-generator'

export const UpdatePlatformRequestBody = Type.Object({
    name: Type.Optional(Type.String()),
    primaryColor: Type.Optional(Type.String()),
    logoIconUrl: Type.Optional(Type.String()),
    fullLogoUrl: Type.Optional(Type.String()),
    favIconUrl: Type.Optional(Type.String()),
    filteredPieceNames: Type.Optional(Type.Array(Type.String())),
    filteredPieceBehavior: Type.Optional(Type.Enum(FilteredPieceBehavior)),
    smtpHost: Type.Optional(Type.String()),
    smtpPort: Type.Optional(Type.Number()),
    smtpUser: Type.Optional(Type.String()),
    smtpPassword: Type.Optional(Type.String()),
    smtpSenderEmail: Type.Optional(Type.String()),
    smtpUseSSL: Type.Optional(Type.Boolean()),
    privacyPolicyUrl: Type.Optional(Type.String()),
    federatedAuthProviders: Type.Optional(FederatedAuthnProviderConfig),
    termsOfServiceUrl: Type.Optional(Type.String()),
    cloudAuthEnabled: Type.Optional(Type.Boolean()),
    emailAuthEnabled: Type.Optional(Type.Boolean()),
    allowedAuthDomains: Type.Optional(Type.Array(Type.String())),
    enforceAllowedAuthDomains: Type.Optional(Type.Boolean()),
    defaultLocale: Type.Optional(Type.Enum(LocalesEnum)),
})

export type UpdatePlatformRequestBody = Static<typeof UpdatePlatformRequestBody>

export const AdminAddPlatformRequestBody = Type.Object({
    userId: ApId,
    projectId: ApId,
    name: Type.String(),
    primaryColor: Type.Optional(Type.String()),
    logoIconUrl: Type.Optional(Type.String()),
    fullLogoUrl: Type.Optional(Type.String()),
    favIconUrl: Type.Optional(Type.String()),
})

export type AdminAddPlatformRequestBody = Static<typeof AdminAddPlatformRequestBody>
