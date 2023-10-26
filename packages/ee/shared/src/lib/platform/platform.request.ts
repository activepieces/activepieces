import { Type, Static } from '@sinclair/typebox'

export const UpdatePlatformRequestBody = Type.Object({
    name: Type.Optional(Type.String()),
    primaryColor: Type.Optional(Type.String()),
    logoIconUrl: Type.Optional(Type.String()),
    fullLogoUrl: Type.Optional(Type.String()),
    favIconUrl: Type.Optional(Type.String()),
})

export type UpdatePlatformRequestBody = Static<typeof UpdatePlatformRequestBody>

export const AdminAddPlatformRequestBody = Type.Object({
    ownerId: Type.String(),
    name: Type.String(),
    primaryColor: Type.Optional(Type.String()),
    logoIconUrl: Type.Optional(Type.String()),
    fullLogoUrl: Type.Optional(Type.String()),
    favIconUrl: Type.Optional(Type.String()),
})

export type AdminAddPlatformRequestBody = Static<typeof AdminAddPlatformRequestBody>
