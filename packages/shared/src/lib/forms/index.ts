import { Static, Type } from '@sinclair/typebox'

const FileResponseInterfaceV1 = Type.Object({
    base64Url: Type.String(),
    fileName: Type.String(),
    extension: Type.Optional(Type.String()),
})

const FileResponseInterfaceV2 = Type.Object({
    mimeType: Type.String(),
    url: Type.String(),
})

export const FileResponseInterface = Type.Union([FileResponseInterfaceV1, FileResponseInterfaceV2])

export type FileResponseInterface = Static<typeof FileResponseInterface>