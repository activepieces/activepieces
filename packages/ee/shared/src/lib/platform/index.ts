import { ApId, BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const Platform = Type.Object({
    ...BaseModelSchema,
    ownerId: ApId,
    primaryColor: Type.String(),
    logoIconUrl: Type.String(),
    fullLogoUrl: Type.String(),
    favIconUrl: Type.String(),
})

export type Platform = Static<typeof Platform>

export const UpdatePlaformRequest = Type.Object({
    primaryColor: Type.String(),
    logoIcon: Type.Unknown(),
    fullLogo: Type.Unknown(),
    favIcon: Type.Unknown(),
})

export type UpdatePlaformRequest = Static<typeof UpdatePlaformRequest>;
