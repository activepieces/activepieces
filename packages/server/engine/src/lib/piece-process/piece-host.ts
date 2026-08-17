import { ChildProcess, fork } from 'node:child_process'
import { EngineGenericError } from '@activepieces/shared'
import { pieceProcessConfig } from './config'
import { reconstructEngineError } from './error-serde'
import { PieceHostMethod, PieceHostRequest, PieceHostResponse } from './piece-process-types'

let child: ChildProcess | null = null
let seq = 0
const pending = new Map<number, PendingRequest>()

function rejectAllPending(error: Error): void {
    for (const [, request] of pending) {
        request.reject(error)
    }
    pending.clear()
}

function startChild(): ChildProcess {
    const execArgv = process.execArgv.filter((arg) => !arg.startsWith('--inspect'))
    const forked = fork(process.argv[1], [pieceProcessConfig.PIECE_HOST_ARG], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: process.env,
        execArgv,
    })

    forked.stdout?.on('data', (data: Buffer) => {
        // eslint-disable-next-line no-console
        console.log(data.toString().trimEnd())
    })
    forked.stderr?.on('data', (data: Buffer) => {
        console.error(data.toString().trimEnd())
    })

    forked.on('message', (msg: PieceHostResponse) => {
        const request = pending.get(msg.id)
        if (!request) {
            return
        }
        pending.delete(msg.id)
        if (msg.ok) {
            request.resolve(msg.result)
        }
        else {
            request.reject(reconstructEngineError(msg.error))
        }
    })

    const onGone = (info: string): void => {
        if (child === forked) {
            child = null
        }
        rejectAllPending(new EngineGenericError('PieceHostExited', `Piece host process exited: ${info}`))
    }
    forked.on('exit', (code, signal) => onGone(`code=${code} signal=${signal}`))
    forked.on('error', (error) => onGone(error.message))

    return forked
}

function ensureStarted(): ChildProcess {
    if (child && child.connected) {
        return child
    }
    child = startChild()
    return child
}

export const pieceHost = {
    call: async <T>(method: PieceHostMethod, params: unknown): Promise<T> => {
        const forked = ensureStarted()
        const id = ++seq
        return new Promise<T>((resolve, reject) => {
            pending.set(id, { resolve: (value) => resolve(value as T), reject })
            const request: PieceHostRequest = { id, method, params }
            forked.send(request, (error) => {
                if (error) {
                    pending.delete(id)
                    reject(error)
                }
            })
        })
    },
    kill: (): void => {
        const forked = child
        child = null
        rejectAllPending(new EngineGenericError('PieceHostKilled', 'Piece host was killed after the operation ended'))
        if (forked) {
            forked.removeAllListeners()
            forked.kill('SIGKILL')
        }
    },
}

type PendingRequest = {
    resolve: (value: unknown) => void
    reject: (error: unknown) => void
}
