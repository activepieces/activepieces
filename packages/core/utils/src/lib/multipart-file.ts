import * as z from 'zod/mini'


export const ApMultipartFile = z.object({
    filename: z.string(),
    data: z.unknown(),
    type: z.literal('file'),
    mimetype: z.optional(z.string()),
})

export type ApMultipartFile = z.infer<typeof ApMultipartFile> & {
    data: Buffer
}

export const isMultipartFile = (value: unknown): value is ApMultipartFile => {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'file' && 'filename' in value && 'data' in value && value.data instanceof Buffer
}
