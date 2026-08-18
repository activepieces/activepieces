import { isNil, isObject } from '@activepieces/core-utils'
import { ApFile, PieceMetadata } from '@activepieces/pieces-framework'
import { ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { FileSource, materializeFile, readFileSource } from '../../variables/processors/file'

export const pieceProtocol = {
    encode: ({ value, callbacks }: EncodeParams): unknown => {
        if (isCallback(value)) {
            const fnId = String(callbacks.size)
            callbacks.set(fnId, value)
            return { [FUNCTION_MARKER]: fnId }
        }
        if (value instanceof ApFile) {
            return { [FILE_MARKER]: { filename: value.filename, data: value.data, extension: value.extension } }
        }
        if (Array.isArray(value)) {
            return value.map((item) => pieceProtocol.encode({ value: item, callbacks }))
        }
        if (!isObject(value) || isTransferableAsIs(value)) {
            return value
        }
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, pieceProtocol.encode({ value: item, callbacks })]))
    },

    decode: async ({ value, invoke }: DecodeParams): Promise<unknown> => {
        if (Array.isArray(value)) {
            return Promise.all(value.map((item) => pieceProtocol.decode({ value: item, invoke })))
        }
        if (!isObject(value) || isTransferableAsIs(value)) {
            return value
        }
        const fnId = readMarker({ value, marker: FUNCTION_MARKER })
        if (typeof fnId === 'string') {
            return (...args: unknown[]) => invoke({ fnId, args })
        }
        const file = readMarker({ value, marker: FILE_MARKER })
        if (isEncodedFile(file)) {
            return new ApFile(file.filename, file.data, file.extension)
        }
        const fileSource = readFileSource(value)
        if (!isNil(fileSource)) {
            return materializeFileOrThrow(fileSource)
        }
        const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await pieceProtocol.decode({ value: item, invoke })]))
        return Object.fromEntries(entries)
    },

    toTransferable: (value: unknown): unknown => {
        if (isCallback(value) || isThenable(value)) {
            return undefined
        }
        if (Array.isArray(value)) {
            return value.map((item) => pieceProtocol.toTransferable(item))
        }
        if (!isObject(value) || isTransferableAsIs(value)) {
            return value
        }
        const entries = Object.entries(value)
            .map(([key, item]) => [key, pieceProtocol.toTransferable(item)])
            .filter(([, item]) => item !== undefined)
        return Object.fromEntries(entries)
    },

    serializeError: (error: unknown): SerializedError => {
        if (!(error instanceof Error)) {
            return { message: String(error) }
        }
        const details: Record<string, unknown> = {}
        for (const key of [...Object.keys(error), ...ERROR_DETAIL_KEYS]) {
            const { data } = readJsonSafe(() => Reflect.get(error, key))
            if (data !== undefined) {
                details[key] = data
            }
        }
        return {
            ...details,
            message: error.message,
            name: error.name === 'Error' ? error.constructor.name : error.name,
            stack: error.stack,
            type: error instanceof ExecutionError ? error.type : undefined,
        }
    },

    deserializeError: ({ message, name, stack, type, ...details }: SerializedError): Error => {
        if (!isNil(type)) {
            return new ExecutionError(name ?? 'ExecutionError', message, type)
        }
        const error = Object.assign(new Error(message), details)
        error.name = name ?? error.name
        error.stack = stack ?? error.stack
        return error
    },
}

async function materializeFileOrThrow(fileSource: FileSource): Promise<NonNullable<Awaited<ReturnType<typeof materializeFile>>>> {
    const file = await materializeFile(fileSource)
    if (isNil(file)) {
        throw new Error(`Expected file url or base64 with mimeType, received: ${fileSource.source}`)
    }
    return file
}

function isCallback(value: unknown): value is Callback {
    return typeof value === 'function'
}

function isThenable(value: unknown): boolean {
    return isObject(value) && typeof value.then === 'function'
}

function isTransferableAsIs(value: object): boolean {
    return Buffer.isBuffer(value) || value instanceof Date
}

function readMarker({ value, marker }: { value: Record<string, unknown>, marker: string }): unknown {
    const keys = Object.keys(value)
    return keys.length === 1 && keys[0] === marker ? value[marker] : undefined
}

function isEncodedFile(value: unknown): value is { filename: string, data: Buffer, extension?: string } {
    return isObject(value) && 'filename' in value && 'data' in value
}

function readJsonSafe(read: () => unknown): { data: unknown } {
    try {
        return { data: JSON.parse(JSON.stringify(read())) }
    }
    catch {
        return { data: undefined }
    }
}

const FUNCTION_MARKER = '__apFn'
const FILE_MARKER = '__apFile'
const ERROR_DETAIL_KEYS = ['response', 'request', 'status', 'headers', 'body', 'error']

type Invoke = (params: { fnId: string, args: unknown[] }) => Promise<unknown>

type EncodeParams = {
    value: unknown
    callbacks: Map<string, Callback>
}

type DecodeParams = {
    value: unknown
    invoke: Invoke
}

type DescribedMetadata = Omit<PieceMetadata, 'name' | 'version' | 'i18n'> & {
    i18n?: PieceMetadata['i18n']
}

type PieceIdentity = {
    piecePath: string
    pieceName: string
    pieceVersion: string
}

export type Callback = (...args: unknown[]) => unknown

export type SerializedError = {
    message: string
    name?: string
    stack?: string
    type?: ExecutionErrorType
    [key: string]: unknown
}

export type PieceDescription = {
    metadata: DescribedMetadata
    functionPaths: string[]
    hasPath: (path: string[]) => boolean
}

export type ParentMessage =
    | (PieceIdentity & { type: 'describe' })
    | (PieceIdentity & { type: 'call', path: string[], args: unknown[] })
    | { type: 'reply', id: string, value?: unknown, error?: SerializedError }

export type ChildMessage =
    | { type: 'invoke', id: string, fnId: string, args: unknown[] }
    | { type: 'done', success: true, result: unknown }
    | { type: 'done', success: false, error: SerializedError }
