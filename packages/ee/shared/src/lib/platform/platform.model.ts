import { ApId, BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export type PlatformId = ApId;

export enum FilteredPieceBehavior {
    ALLOWED = 'ALLOWED',
    BLOCKED = 'BLOCKED',
}

export const Platform = Type.Object({
    ...BaseModelSchema,
    ownerId: ApId,
    name: Type.String(),
    primaryColor: Type.String(),
    logoIconUrl: Type.String(),
    fullLogoUrl: Type.String(),
    favIconUrl: Type.String(),
    filteredPieceNames: Type.Array(Type.String()),
    filteredPieceBehavior: Type.Enum(FilteredPieceBehavior),
    smtpHost: Type.Optional(Type.String()),
    smtpPort: Type.Optional(Type.Number()),
    smtpUser: Type.Optional(Type.String()),
    smtpPassword: Type.Optional(Type.String()),
    smtpSenderEmail: Type.Optional(Type.String()),
    smtpUseSSL: Type.Optional(Type.Boolean()),
    privacyPolicyUrl: Type.Optional(Type.String()),
    termsOfServiceUrl: Type.Optional(Type.String()),
    cloudAuthEnabled: Type.Boolean(),
    showPoweredBy: Type.Boolean(),
})

export type Platform = Static<typeof Platform>
