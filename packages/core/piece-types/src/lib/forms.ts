import * as z from 'zod/mini'

const FileResponseInterfaceV1 = z.object({
    base64Url: z.string(),
    fileName: z.string(),
    extension: z.optional(z.string()),
})

const FileResponseInterfaceV2 = z.object({
    mimeType: z.string(),
    url: z.string(),
    fileName: z.optional(z.string()),
})

export const FileResponseInterface = z.union([FileResponseInterfaceV1, FileResponseInterfaceV2])
export type FileResponseInterface = z.infer<typeof FileResponseInterface>

export enum HumanInputFormResultTypes {
    FILE = 'file',
    MARKDOWN = 'markdown',
}

export function createKeyForFormInput(displayName: string): string {
    const inputKey = displayName
        .toLowerCase()
        .replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase())
        .replace(/^(.)/, letter => letter.toLowerCase())

    /**We do this because react form inputs must not contain quotes */
    return inputKey.replaceAll(/[\\"''\n\r\t]/g, '')
}

export const HumanInputFormResult = z.union([
    z.object({
        type: z.literal(HumanInputFormResultTypes.FILE),
        value: FileResponseInterface,
    }),
    z.object({
        type: z.literal(HumanInputFormResultTypes.MARKDOWN),
        value: z.string(),
        files: z.optional(z.array(FileResponseInterface)),
    }),
])
export type HumanInputFormResult = z.infer<typeof HumanInputFormResult>

export const ChatFormResponse = z.object({
    sessionId: z.string(),
    message: z.string(),
    files: z.optional(z.array(z.string())),
})
export type ChatFormResponse = z.infer<typeof ChatFormResponse>
