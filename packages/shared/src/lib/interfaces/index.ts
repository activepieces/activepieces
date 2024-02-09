import { Static, Type } from '@sinclair/typebox'


export const FileResponseInterface = Type.Object({
    base64Url: Type.String(),
    fileName: Type.String(),
    extension: Type.Optional(Type.String()),
})

export type FileResponseInterface = Static<typeof FileResponseInterface>