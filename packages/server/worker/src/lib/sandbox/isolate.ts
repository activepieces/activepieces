import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import path from 'path'
import { arch } from 'process'
import { execPromise } from '../utils/exec'
import { CreateSandboxProcessParams, SandboxLogger, SandboxProcessMaker } from './types'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }
    return executableNameMap[arch] ?? defaultName
}

const isolateBinaryPath = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())
const etcDir = path.resolve(process.cwd(), 'packages/server/api/src/assets/etc')
const sandboxIndex: Record<string, number> = {}

function getSandboxNumber(sandboxId: string): number {
    if (sandboxIndex[sandboxId] !== undefined) {
        return sandboxIndex[sandboxId]
    }
    sandboxIndex[sandboxId] = Object.keys(sandboxIndex).length
    return sandboxIndex[sandboxId]
}

export function isolateProcess(log: SandboxLogger, enginePath: string, _codeDirectory: string): SandboxProcessMaker {
    return {
        create: async (params: CreateSandboxProcessParams) => {
            const { sandboxId, mounts, env } = params
            const sandboxNumber = getSandboxNumber(sandboxId)

            await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --cleanup`)
            await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --init`)

            // Pre-create /root and mount subdirs in the sandbox rootfs (isolate doesn't create /root by default)
            const sandboxRootfs = `/var/local/lib/isolate/${sandboxNumber}/root`
            await mkdir(`${sandboxRootfs}/root/common`, { recursive: true })
            await mkdir(`${sandboxRootfs}/root/codes`, { recursive: true })

            // Engine runs at /root/common/<filename> inside the sandbox (common dir is mounted there)
            const engineSandboxPath = path.join('/root/common', path.basename(enginePath))
            const sandboxEnv = {
                ...env,
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: sandboxId,
            }

            const envArgs = Object.entries(sandboxEnv)
                .map(([key, value]) => `--env=${key}='${value}'`)

            const dirArgs = mounts.map((m) => {
                const suffix = m.optional ? ':maybe' : ''
                return `--dir=${m.sandboxPath}=${m.hostPath}${suffix}`
            })

            const args = [
                '--dir=/usr/bin/',
                '--dir=/usr/local/',
                `--dir=/etc/=${etcDir}`,
                '--dir=/usr/src/node_modules/',
                ...dirArgs,
                '--share-net',
                `--box-id=${sandboxNumber}`,
                '--processes',
                '--chdir=/root',
                ...envArgs,
                '--run',
                '--',
                process.execPath,
                engineSandboxPath,
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
