import { spawn } from 'node:child_process'
import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { EngineGenericError } from '@activepieces/shared'
import { piecePath } from './piece-path'
import { Callback, ChildMessage, ParentMessage, PieceDescription, pieceProtocol } from './piece-protocol'

export const pieceRunner = {
    describe: async (piece: PieceRef): Promise<PieceDescription> => {
        const cacheKey = `${piece.pieceName}@${piece.pieceVersion}`
        const cached = descriptions.get(cacheKey)
        if (!isNil(cached)) {
            return cached
        }
        const description = runInChildProcess({ piece, request: { type: 'describe' } }).then(toPieceDescription)
        descriptions.set(cacheKey, description)
        description.catch(() => descriptions.delete(cacheKey))
        return description
    },

    call: async ({ piece, path: methodPath, args }: CallParams): Promise<unknown> => {
        return runInChildProcess({ piece, request: { type: 'call', path: methodPath, args } })
    },
}

async function runInChildProcess({ piece, request }: RunInChildProcessParams): Promise<unknown> {
    const entryPath = await piecePath.resolve(piece)
    const callbacks = new Map<string, Callback>()
    const inFlight = new Set<Promise<unknown>>()

    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [childEntryPath()], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            serialization: 'advanced',
        })
        let settled = false
        let output = ''
        let completion: CompletionMessage | undefined = undefined

        const settle = (apply: () => void): void => {
            if (settled) {
                return
            }
            settled = true
            child.kill()
            apply()
        }

        const complete = (message: CompletionMessage): void => {
            settle(() => message.success ? resolve(message.result) : reject(pieceProtocol.deserializeError(message.error)))
        }

        const send = (message: ParentMessage): void => {
            tryCatchSync(() => child.send(message))
        }

        child.stdout?.on('data', (data: Buffer) => {
            output += data.toString()
            console.log(data.toString().trimEnd())
        })
        child.stderr?.on('data', (data: Buffer) => {
            output += data.toString()
            console.error(data.toString().trimEnd())
        })

        const invokeCallback = async ({ id, fnId, args }: { id: string, fnId: string, args: unknown[] }): Promise<void> => {
            const callback = callbacks.get(fnId)
            if (isNil(callback)) {
                send({ type: 'reply', id, error: { message: `Unknown callback ${fnId}` } })
                return
            }
            const { data, error } = await tryCatch(async () => pieceProtocol.encode({ value: await callback(...args), callbacks }))
            send({ type: 'reply', id, value: data, error: isNil(error) ? undefined : pieceProtocol.serializeError(error) })
        }

        const handleMessage = async (message: ChildMessage): Promise<void> => {
            if (message.type === 'invoke') {
                const call = invokeCallback(message)
                inFlight.add(call)
                await call.finally(() => inFlight.delete(call))
                return
            }
            completion = message
            await Promise.allSettled(inFlight)
            complete(message)
        }

        child.on('message', (message: ChildMessage) => {
            handleMessage(message).catch((error: Error) => settle(() => reject(error)))
        })

        child.on('close', (code, signal) => {
            if (!isNil(completion)) {
                complete(completion)
                return
            }
            settle(() => reject(new EngineGenericError('PieceProcessExitedError', withOutput(`Piece process exited with code ${code} and signal ${signal}`, output))))
        })

        child.on('error', (error) => {
            settle(() => reject(new EngineGenericError('PieceProcessError', withOutput(error.message, output))))
        })

        const { error: sendError } = tryCatchSync(() => {
            const message: ParentMessage = request.type === 'describe'
                ? { type: 'describe', piecePath: entryPath, pieceName: piece.pieceName, pieceVersion: piece.pieceVersion }
                : { type: 'call', piecePath: entryPath, pieceName: piece.pieceName, pieceVersion: piece.pieceVersion, path: request.path, args: request.args.map((value) => pieceProtocol.encode({ value, callbacks })) }
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

function withOutput(message: string, output: string): string {
    return output.trim().length === 0 ? message : `${message}\n${output.trim()}`
}

function childEntryPath(): string {
    return process.env.AP_PIECE_CHILD_ENTRY ?? path.join(__dirname, 'piece-child.js')
}

const descriptions = new Map<string, Promise<PieceDescription>>()

type CompletionMessage = Extract<ChildMessage, { type: 'done' }>

type RunInChildProcessParams = {
    piece: PieceRef
    request: { type: 'describe' } | { type: 'call', path: string[], args: unknown[] }
}

export type PieceRef = {
    pieceName: string
    pieceVersion: string
    devPieces: string[]
}

export type CallParams = {
    piece: PieceRef
    path: string[]
    args: unknown[]
}
