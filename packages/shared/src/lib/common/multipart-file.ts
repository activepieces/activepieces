import { Static, Type } from '@sinclair/typebox'


export const ApMultipartFile = Type.Object({
    filename: Type.String(),
    data: Type.Unknown(),
    type: Type.Literal('file'),
})

export type ApMultipartFile = Static<typeof ApMultipartFile> & {
    data: Buffer
}

export const isMultipartFile = (value: unknown): value is ApMultipartFile => {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'file' && 'filename' in value && 'data' in value && value.data instanceof Buffer
}