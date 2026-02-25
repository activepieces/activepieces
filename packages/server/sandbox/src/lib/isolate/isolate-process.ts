import { spawn } from 'child_process'
import path from 'path'
import { arch } from 'process'
import { execPromise } from '@activepieces/server-shared'
import { CreateSandboxProcessParams, SandboxLogger, SandboxProcessMaker } from '../types'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }
    return executableNameMap[arch] ?? defaultName
}

const isolateBinaryPath = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())
const sandboxIndex: Record<string, number> = {}

function getSandboxNumber(sandboxId: string): number {
    if (sandboxIndex[sandboxId] !== undefined) {
        return sandboxIndex[sandboxId]
    }
    sandboxIndex[sandboxId] = Object.keys(sandboxIndex).length
    return sandboxIndex[sandboxId]
}

export function isolateProcess(log: SandboxLogger): SandboxProcessMaker {
    return {
        create: async (params: CreateSandboxProcessParams) => {
            const { sandboxId, command, mounts, env } = params
            const sandboxNumber = getSandboxNumber(sandboxId)

            await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --cleanup`)
            await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --init`)

            const envArgs = Object.entries(env)
                .map(([key, value]) => `--env=${key}='${value}'`)

            const dirArgs = mounts.map((m) => {
                const suffix = m.optional ? ':maybe' : ''
                return `--dir=${m.sandboxPath}=${m.hostPath}${suffix}`
            })

            const [binary, ...scriptArgs] = command

            const args = [
                '--dir=/usr/bin/',
                ...dirArgs,
                '--share-net',
                `--box-id=${sandboxNumber}`,
                '--processes',
                '--chdir=/root',
                '--run',
                ...envArgs,
                binary,
                ...scriptArgs,
            ]

            log.debug({ sandboxId, command: `${isolateBinaryPath} ${args.join(' ')}` }, 'Spawning isolate process')

            const child = spawn(isolateBinaryPath, args, {
                shell: true,
            })

            child.stdout?.on('data', (data: Buffer) => {
                process.stdout.write(data)
            })
            child.stderr?.on('data', (data: Buffer) => {
                process.stderr.write(data)
            })

            return child
        },
    }
}
