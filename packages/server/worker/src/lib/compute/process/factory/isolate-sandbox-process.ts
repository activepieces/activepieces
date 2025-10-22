import { spawn } from 'node:child_process'
import path from 'node:path'
import { arch } from 'node:process'
import { execPromise, fileSystemUtils, PiecesSource } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CODE_CACHE_PATH } from '../../../cache/worker-cache'
import { workerMachine } from '../../../utils/machine'
import { EngineProcess } from './engine-factory-types'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }

    return executableNameMap[arch] ?? defaultName
}

const currentDir = process.cwd()
const nodeExecutablePath = process.execPath
const isolateBinaryPath = path.resolve(currentDir, 'packages/server/api/src/assets', getIsolateExecutableName())

export const isolateSandboxProcess = (log: FastifyBaseLogger): EngineProcess => ({
    create: async (params) => {
        const { workerId, workerIndex, options } = params

        await execPromise(`${isolateBinaryPath} --box-id=${workerIndex} --cleanup`)
        await execPromise(`${isolateBinaryPath} --box-id=${workerIndex} --init`)

        const propagatedEnvVars = getEnvironmentVariables(options.env, workerId)
        const dirsToBindArgs: string[] = await getDirsToBindArgs(params.flowVersionId, params.customPiecesPath)
        const args = [
            ...dirsToBindArgs,
            '--share-net',
            `--box-id=${workerIndex}`,
            '--processes',
            '--chdir=/root',
            '--run',
            ...propagatedEnvVars,
            nodeExecutablePath,
            '/root/main.js',
        ]

        log.debug({ command: `${isolateBinaryPath} ${args.join(' ')}` }, '[IsolateSandboxProcess#create] Executing command')
        const isolateProcess = spawn(isolateBinaryPath, args, {
            shell: true,
        })

        isolateProcess.stdout?.on('data', (data) => {
            process.stdout.write(data)
        })
        isolateProcess.stderr?.on('data', (data) => {
            process.stderr.write(data)
        })

        return isolateProcess
    },
})

function getEnvironmentVariables(env: Record<string, string | undefined>, workerId: string): string[] {
    return Object.entries({
        ...env,
        AP_BASE_CODE_DIRECTORY: '/codes',
        HOME: '/tmp/',
        WORKER_ID: workerId,
    }).map(([key, value]) => `--env=${key}='${value}'`)
}

async function getDirsToBindArgs(flowVersionId: string | undefined, customPiecesPath: string): Promise<string[]> {
    const etcDir = path.resolve('./packages/server/api/src/assets/etc/')

    const dirsToBind = [
        '--dir=/usr/bin/',
        `--dir=/etc/=${etcDir}`,
        `--dir=/root=${path.resolve(GLOBAL_CACHE_COMMON_PATH)}`,
    ]
    const fExists = !isNil(flowVersionId) && await fileSystemUtils.fileExists(path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId))
    if (fExists) {
        dirsToBind.push(`--dir=${path.join('/codes', flowVersionId)}=${path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId)}`)
    }
    if (customPiecesPath) {
        dirsToBind.push(`--dir=/pieces=${path.resolve(customPiecesPath, 'pieces')}:maybe`)
    }

    const piecesSource = workerMachine.getSettings().PIECES_SOURCE

    if (piecesSource === PiecesSource.FILE) {
        const basePath = path.resolve(__dirname.split('/dist')[0])

        dirsToBind.push(
            `--dir=${path.join(basePath, '.pnpm')}=/${path.join(basePath, '.pnpm')}:maybe`,
            `--dir=${path.join(basePath, 'dist')}=/${path.join(basePath, 'dist')}:maybe`,
            `--dir=${path.join(basePath, 'node_modules')}=/${path.join(basePath, 'node_modules')}:maybe`,
        )
    }

    return dirsToBind
}