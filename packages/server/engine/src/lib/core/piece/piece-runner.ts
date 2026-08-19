import { spawn } from 'node:child_process'
import path from 'node:path'
import { isNil, tryCatchSync } from '@activepieces/core-utils'
import { EngineGenericError, PieceMemoryLimitError } from '@activepieces/shared'
import { piecePath } from './piece-path'
import { ChildMessage, CollectedHooks, ContextRequest, ParentMessage, PieceDescription, pieceProtocol } from './piece-protocol'

export const pieceRunner = {
    describe: async (piece: PieceRef): Promise<PieceDescription> => {
        const cacheKey = `${piece.pieceName}@${piece.pieceVersion}`
        const cached = descriptions.get(cacheKey)
        if (!isNil(cached)) {
            return cached
        }
        const description = runInChildProcess({ piece, request: { type: 'describe' } }).then(({ result }) => toPieceDescription(result))
        descriptions.set(cacheKey, description)
        description.catch(() => descriptions.delete(cacheKey))
        return description
    },

    call: async ({ piece, path: methodPath, args = [], context }: CallParams): Promise<CallResult> => {
        return runInChildProcess({ piece, request: { type: 'call', path: methodPath, args, context } })
    },
}

async function runInChildProcess({ piece, request }: RunInChildProcessParams): Promise<CallResult> {
    const entryPath = await piecePath.resolve(piece)

    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [...process.execArgv, childEntryPath()], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            serialization: 'advanced',
        })
        let settled = false
        let output = ''

        const settle = (apply: () => void): void => {
            if (settled) {
                return
            }
            settled = true
            child.kill()
            apply()
        }

        child.stdout?.on('data', (data: Buffer) => {
            output += data.toString()
            console.log(data.toString().trimEnd())
        })
        child.stderr?.on('data', (data: Buffer) => {
            output += data.toString()
            console.error(data.toString().trimEnd())
        })

        child.on('message', (message: ChildMessage) => {
            settle(() => message.success
                ? resolve({ result: message.result, hooks: message.hooks })
                : reject(pieceProtocol.deserializeError(message.error)))
        })

        child.on('close', (code, signal) => {
            settle(() => reject(toExitError({ code, signal, output })))
        })

        child.on('error', (error) => {
            settle(() => reject(new EngineGenericError('PieceProcessError', withOutput(error.message, output))))
        })

        const identity = { piecePath: entryPath, pieceName: piece.pieceName, pieceVersion: piece.pieceVersion }
        const { error: sendError } = tryCatchSync(() => {
            const message: ParentMessage = request.type === 'describe'
                ? { ...identity, type: 'describe' }
                : { ...identity, type: 'call', path: request.path, args: request.args, context: request.context }
            child.send(message)
        })
        if (sendError) {
            settle(() => reject(new EngineGenericError('PieceArgumentsNotSerializableError', sendError.message)))
        }
    })
}

function toPieceDescription(value: unknown): PieceDescription {
    const metadata = Reflect.get(Object(value), 'metadata')
    const functionPaths = Reflect.get(Object(value), 'functionPaths')
    if (isNil(metadata) || !Array.isArray(functionPaths)) {
        throw new EngineGenericError('PieceDescriptionInvalidError', 'Piece process returned an unexpected description')
    }
    return {
        metadata,
        functionPaths,
        hasPath: (path: string[]) => functionPaths.includes(path.join('.')),
    }
}

export function toExitError({ code, signal, output }: ExitParams): Error {
    if (isOutOfMemory({ code, signal, output })) {
        return new PieceMemoryLimitError(heapLimitMb(), output.trim())
    }
    return new EngineGenericError('PieceProcessExitedError', withOutput(`Piece process exited with code ${code} and signal ${signal}`, output))
}

// Mirrors the engine-side signatures in sandbox.ts: V8 saying it ran out of heap, or aborting,
// is unambiguous. A SIGKILL is ambiguous there because shutdown kills the engine the same way —
// here it is not, since the only kill we issue happens after the call has already settled.
function isOutOfMemory({ code, signal, output }: ExitParams): boolean {
    return output.includes('JavaScript heap out of memory')
        || code === 134
        || signal === 'SIGABRT'
        || signal === 'SIGKILL'
}

function heapLimitMb(): string | undefined {
    return process.execArgv.find((arg) => arg.startsWith('--max-old-space-size='))?.split('=')[1]
}

function withOutput(message: string, output: string): string {
    return output.trim().length === 0 ? message : `${message}\n${output.trim()}`
}

function childEntryPath(): string {
    return process.env.AP_PIECE_CHILD_ENTRY ?? path.join(__dirname, 'piece-child.js')
}

const descriptions = new Map<string, Promise<PieceDescription>>()

type RunInChildProcessParams = {
    piece: PieceRef
    request: { type: 'describe' } | { type: 'call', path: string[], args: unknown[], context?: ContextRequest }
}

type ExitParams = {
    code: number | null
    signal: NodeJS.Signals | null
    output: string
}

export type PieceRef = {
    pieceName: string
    pieceVersion: string
    devPieces: string[]
}

export type CallParams = {
    piece: PieceRef
    path: string[]
    args?: unknown[]
    context?: ContextRequest
}

export type CallResult = {
    result: unknown
    hooks?: CollectedHooks
}
