import { isNil, isObject } from '@activepieces/core-utils'
import { ContextVersion, PieceMetadata } from '@activepieces/pieces-framework'
import { ExecutionError, ExecutionErrorType, ExecutionType, PropertySettings, ResumePayload, ScheduleOptions } from '@activepieces/shared'
import { HookResponse } from '../../utils'

export const pieceProtocol = {
    toTransferable: (value: unknown): unknown => {
        if (typeof value === 'function' || isThenable(value)) {
            return undefined
        }
        if (Array.isArray(value)) {
            return value.map((item) => pieceProtocol.toTransferable(item))
        }
        if (!isObject(value) || Buffer.isBuffer(value) || value instanceof Date) {
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

function isThenable(value: unknown): boolean {
    return isObject(value) && typeof value.then === 'function'
}

function readJsonSafe(read: () => unknown): { data: unknown } {
    try {
        return { data: JSON.parse(JSON.stringify(read())) }
    }
    catch {
        return { data: undefined }
    }
}

const ERROR_DETAIL_KEYS = ['response', 'request', 'status', 'headers', 'body', 'error']

type PieceIdentity = {
    piecePath: string
    pieceName: string
    pieceVersion: string
}

export type PieceRuntime = {
    internalApiUrl: string
    publicApiUrl: string
    engineToken: string
    projectId: string
    flowId: string
    flowVersionId: string
    flowRunId: string
    pieceName: string
    contextVersion?: ContextVersion
    actionRunMode: boolean
    workerHandlerId?: string
    httpRequestId?: string
}

export type ActionContextRequest = {
    kind: 'action'
    runtime: PieceRuntime
    actionName: string
    stepName: string
    resolvedInput: Record<string, unknown>
    propertySettings: Record<string, PropertySettings>
    executionType: ExecutionType
    resumePayload?: ResumePayload
}

export type TriggerContextRequest = {
    kind: 'trigger'
    runtime: PieceRuntime
    stepName: string
    resolvedInput: Record<string, unknown>
    propertySettings: Record<string, PropertySettings>
    payload: unknown
    storePrefix: string
    includeFiles: boolean
    webhookUrl?: string
    isRepublish?: boolean
}

export type PropsContextRequest = {
    kind: 'props'
    runtime: PieceRuntime
    stepName: string
    resolvedInput: Record<string, unknown>
    searchValue?: string
}

export type ContextRequest = ActionContextRequest | TriggerContextRequest | PropsContextRequest

export type PieceDescription = {
    metadata: DescribedMetadata
    functionPaths: string[]
    hasPath: (path: string[]) => boolean
}

type DescribedMetadata = Omit<PieceMetadata, 'name' | 'version' | 'i18n'> & {
    i18n?: PieceMetadata['i18n']
}

type AppListener = {
    events: string[]
    identifierValue: string
    identifierKey: string
}

export type CollectedHooks = {
    hookResponse: HookResponse
    listeners: AppListener[]
    scheduleOptions?: ScheduleOptions
}

export type SerializedError = {
    message: string
    name?: string
    stack?: string
    type?: ExecutionErrorType
    [key: string]: unknown
}

export type ParentMessage =
    | (PieceIdentity & { type: 'describe' })
    | (PieceIdentity & { type: 'call', path: string[], args: unknown[], context?: ContextRequest })

export type ChildMessage =
    | { type: 'done', success: true, result: unknown, hooks?: CollectedHooks }
    | { type: 'done', success: false, error: SerializedError }
