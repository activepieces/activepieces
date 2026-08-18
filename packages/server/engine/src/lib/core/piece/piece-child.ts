import { isNil, isObject } from '@activepieces/core-utils'
import { Piece } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import { ChildMessage, ParentMessage, pieceProtocol } from './piece-protocol'

export const pieceChild = {
    listen: (): void => {
        process.on('message', (message: ParentMessage) => void handleParentMessage(message))
        process.on('disconnect', () => process.exit(0))
        process.on('unhandledRejection', (reason) => report({ type: 'done', success: false, error: pieceProtocol.serializeError(reason) }))
        process.on('uncaughtException', (error) => report({ type: 'done', success: false, error: pieceProtocol.serializeError(error) }))
    },
}

async function handleParentMessage(message: ParentMessage): Promise<void> {
    if (message.type === 'reply') {
        await resolvePendingCall(message)
        return
    }
    try {
        const piece = await loadPiece(message)
        const result = message.type === 'describe' ? describe(piece) : await callPiece({ piece, path: message.path, args: message.args })
        report({ type: 'done', success: true, result: pieceProtocol.toTransferable(result) })
    }
    catch (error) {
        report({ type: 'done', success: false, error: pieceProtocol.serializeError(error) })
    }
}

async function loadPiece({ piecePath, pieceName, pieceVersion }: { piecePath: string, pieceName: string, pieceVersion: string }): Promise<Piece> {
    const pieceModule = await import(piecePath)
    return extractPieceFromModule<Piece>({ module: pieceModule, pieceName, pieceVersion })
}

function describe(piece: Piece): unknown {
    return {
        metadata: piece.metadata(),
        functionPaths: collectFunctionPaths({ value: callableRoot(piece), path: [], depth: 0, seen: new Set() }),
    }
}

async function callPiece({ piece, path, args }: { piece: Piece, path: string[], args: unknown[] }): Promise<unknown> {
    const { owner, method } = resolveMethod({ piece, path })
    const decodedArgs = await Promise.all(args.map((arg) => pieceProtocol.decode({ value: arg, invoke })))
    return method.apply(owner, decodedArgs)
}

function callableRoot(piece: Piece): Record<string, unknown> {
    return {
        actions: piece.actions(),
        triggers: piece.triggers(),
        auth: piece.auth,
        events: piece.events,
    }
}

function resolveMethod({ piece, path }: { piece: Piece, path: string[] }): { owner: unknown, method: PieceMethod } {
    let owner: unknown = undefined
    let current: unknown = callableRoot(piece)
    for (const segment of path) {
        if (!isObject(current)) {
            throw new Error(`Path not found in piece: ${path.join('.')}`)
        }
        owner = current
        current = Reflect.get(current, segment)
    }
    if (!isPieceMethod(current)) {
        throw new Error(`Path is not callable in piece: ${path.join('.')}`)
    }
    return { owner, method: current }
}

function isPieceMethod(value: unknown): value is PieceMethod {
    return typeof value === 'function'
}

function collectFunctionPaths({ value, path, depth, seen }: CollectParams): string[] {
    if (depth > MAX_FUNCTION_PATH_DEPTH || !isObject(value) || seen.has(value)) {
        return []
    }
    return Object.entries(value).flatMap(([key, item]) => {
        const itemPath = [...path, key]
        return typeof item === 'function' ? [itemPath.join('.')] : collectFunctionPaths({ value: item, path: itemPath, depth: depth + 1, seen: new Set([...seen, value]) })
    })
}

async function resolvePendingCall({ id, value, error }: { id: string, value?: unknown, error?: unknown }): Promise<void> {
    const call = pendingCalls.get(id)
    if (isNil(call)) {
        return
    }
    pendingCalls.delete(id)
    if (isNil(error)) {
        call.resolve(await pieceProtocol.decode({ value, invoke }))
        return
    }
    call.reject(pieceProtocol.deserializeError(isObject(error) ? { message: '', ...error } : { message: String(error) }))
}

function report(message: ChildMessage): void {
    if (settled) {
        return
    }
    settled = true
    process.send?.(message, () => process.exit(0))
}

const invoke = async ({ fnId, args }: { fnId: string, args: unknown[] }): Promise<unknown> => {
    const id = String(nextCallId++)
    return new Promise((resolve, reject) => {
        pendingCalls.set(id, { resolve, reject })
        process.send?.({ type: 'invoke', id, fnId, args })
    })
}

const pendingCalls = new Map<string, PendingCall>()
const MAX_FUNCTION_PATH_DEPTH = 6
let nextCallId = 0
let settled = false

type PieceMethod = (...args: unknown[]) => unknown

type PendingCall = {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
}

type CollectParams = {
    value: unknown
    path: string[]
    depth: number
    seen: Set<object>
}
