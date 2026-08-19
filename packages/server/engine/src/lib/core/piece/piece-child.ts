import { isNil, isObject } from '@activepieces/core-utils'
import { Piece } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import { buildContext } from './piece-context-builder'
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
    try {
        const piece = await loadPiece(message)
        if (message.type === 'describe') {
            report({ type: 'done', success: true, result: describe(piece) })
            return
        }
        const built = isNil(message.context) ? undefined : await buildContext({ piece, request: message.context })
        const method = resolveMethod({ piece, path: message.path })
        const result = await method.call(...[...message.args, ...built?.args ?? []])
        await Promise.allSettled(built?.pending ?? [])
        report({
            type: 'done',
            success: true,
            result: pieceProtocol.toTransferable(result),
            hooks: built?.hooks,
        })
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
        metadata: pieceProtocol.toTransferable(piece.metadata()),
        functionPaths: collectFunctionPaths({ value: callableRoot(piece), path: [], depth: 0, seen: new Set() }),
    }
}

function callableRoot(piece: Piece): Record<string, unknown> {
    return {
        actions: piece.actions(),
        triggers: piece.triggers(),
        auth: piece.auth,
        events: piece.events,
    }
}

function resolveMethod({ piece, path }: { piece: Piece, path: string[] }): BoundMethod {
    let owner: unknown = undefined
    let current: unknown = callableRoot(piece)
    for (const segment of path) {
        if (!isObject(current)) {
            throw new Error(`Path not found in piece: ${path.join('.')}`)
        }
        owner = current
        current = Reflect.get(current, segment)
    }
    if (typeof current !== 'function') {
        throw new Error(`Path is not callable in piece: ${path.join('.')}`)
    }
    const method = current
    return { call: async (...args: unknown[]) => method.apply(owner, args) }
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

function report(message: ChildMessage): void {
    if (settled) {
        return
    }
    settled = true
    process.send?.(message, () => process.exit(0))
}

const MAX_FUNCTION_PATH_DEPTH = 6
let settled = false

type BoundMethod = {
    call: (...args: unknown[]) => Promise<unknown>
}

type CollectParams = {
    value: unknown
    path: string[]
    depth: number
    seen: Set<object>
}
