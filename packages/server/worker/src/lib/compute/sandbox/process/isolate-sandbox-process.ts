import { spawn } from 'node:child_process'
import path from 'node:path'
import { arch } from 'node:process'
import { execPromise, fileSystemUtils } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { registryPieceManager } from '../../../cache/pieces/production/registry-piece-manager'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CODE_CACHE_PATH } from '../../../cache/worker-cache'
import { workerMachine } from '../../../utils/machine'
import { CreateProcessParams, ProcessMaker } from './types'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }

    return executableNameMap[arch] ?? defaultName
}

const nodeExecutablePath = process.execPath
const isolateBinaryPath = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())
const sandboxIndex: Record<string, number> = {}


export const isolateSandboxProcess = (log: FastifyBaseLogger): ProcessMaker => ({
    create: async (params) => {
        const { env, sandboxId } = params
        const sandboxNumber = getSandboxNumber(sandboxId)

        await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --cleanup`)
        await execPromise(`${isolateBinaryPath} --box-id=${sandboxNumber} --init`)

        const propagatedEnvVars = Object.entries({
            ...env,
            SANDBOX_ID: sandboxId,
            AP_BASE_CODE_DIRECTORY: '/codes',
            HOME: '/tmp/',
        }).map(([key, value]) => `--env=${key}='${value}'`)

        const dirsToBindArgs: string[] = await getDirsToBindArgs(log, params)
        const args = [
            ...dirsToBindArgs,
            '--share-net',
            `--box-id=${sandboxNumber}`,
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


async function getDirsToBindArgs(log: FastifyBaseLogger, options: CreateProcessParams): Promise<string[]> {
    const etcDir = path.resolve('./packages/server/api/src/assets/etc/')

    const dirsToBind = [
        '--dir=/usr/bin/',
        `--dir=/etc/=${etcDir}`,
        `--dir=/root=${path.resolve(GLOBAL_CACHE_COMMON_PATH)}`,
    ]

    if (options.reusable) {
        dirsToBind.push(`--dir=/codes=${path.resolve(GLOBAL_CODE_CACHE_PATH)}`)
    }
    else {
        const flowVersionId = options.flowVersionId
        const fExists = !isNil(flowVersionId) && await fileSystemUtils.fileExists(path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId))
        if (fExists) {
            dirsToBind.push(`--dir=${path.join('/codes', flowVersionId)}=${path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId)}`)
        }
    }

    const customPiecesPath = registryPieceManager(log).getCustomPiecesPath(options.platformId)
    if (customPiecesPath) {
        dirsToBind.push(`--dir=/node_modules=${path.resolve(customPiecesPath, 'node_modules')}:maybe`)
        dirsToBind.push(`--dir=/pieces=${path.resolve(customPiecesPath, 'pieces')}:maybe`)
    }

    const devPieces = workerMachine.getSettings().DEV_PIECES

    if (devPieces.length > 0) {
        const basePath = path.resolve(__dirname.split('/dist')[0])

        dirsToBind.push(
            `--dir=${path.join(basePath, 'dist')}=/${path.join(basePath, 'dist')}:maybe`,
            `--dir=${path.join(basePath, 'node_modules')}=/${path.join(basePath, 'node_modules')}:maybe`,
        )
    }

    return dirsToBind
}

function getSandboxNumber(sandboxId: string): number {
    if (!isNil(sandboxIndex[sandboxId])) {
        return sandboxIndex[sandboxId]
    }
    sandboxIndex[sandboxId] = Object.keys(sandboxIndex).length
    return sandboxIndex[sandboxId]
}