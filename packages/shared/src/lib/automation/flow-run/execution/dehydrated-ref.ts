export const DEHYDRATED_REF_MARKER = '$apRef'

export type DehydratedRef = {
    [DEHYDRATED_REF_MARKER]: true
    fileId: string
    size: number
}

export const isDehydratedRef = (value: unknown): value is DehydratedRef => {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as Record<string, unknown>)[DEHYDRATED_REF_MARKER] === true &&
        typeof (value as DehydratedRef).fileId === 'string' &&
        typeof (value as DehydratedRef).size === 'number'
    )
}

export const buildDehydratedRef = (params: { fileId: string, size: number }): DehydratedRef => ({
    [DEHYDRATED_REF_MARKER]: true,
    fileId: params.fileId,
    size: params.size,
})

export const FLOW_RUN_LOG_MANIFEST_V2 = 2
