import { Static, Type } from '@sinclair/typebox'

const FileResponseInterfaceV1 = Type.Object({
    base64Url: Type.String(),
    fileName: Type.String(),
    extension: Type.Optional(Type.String()),
})

const FileResponseInterfaceV2 = Type.Object({
    mimeType: Type.String(),
    url: Type.String(),
    fileName: Type.Optional(Type.String()),
})

export const FileResponseInterface = Type.Union([FileResponseInterfaceV1, FileResponseInterfaceV2])

export type FileResponseInterface = Static<typeof FileResponseInterface>



export enum HumanInputFormResultTypes {
    FILE = 'file',
    MARKDOWN = 'markdown',
}

export const HumanInputFormResult = Type.Union([
    Type.Object({
        type: Type.Literal(HumanInputFormResultTypes.FILE),
        value: FileResponseInterface,
    }),
    Type.Object({
        type: Type.Literal(HumanInputFormResultTypes.MARKDOWN),
        value: Type.String(),
        files: Type.Optional(Type.Array(FileResponseInterface)),
    }),
])

export type HumanInputFormResult = Static<typeof HumanInputFormResult>
