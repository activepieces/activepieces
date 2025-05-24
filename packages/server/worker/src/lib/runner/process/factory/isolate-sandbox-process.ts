import { arch } from "node:process"
import { EngineProcess } from "./engine-factory-types"
import path from "node:path"
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CODE_CACHE_PATH } from "../../../cache/execution-files"
import { workerMachine } from "../../../utils/machine"
import { execPromise, fileExists, PiecesSource } from "@activepieces/server-shared"
import { FastifyBaseLogger } from "fastify"
import { exec } from "node:child_process"
import { isNil } from "@activepieces/shared"

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
        const fullCommand = [
            isolateBinaryPath,
            ...dirsToBindArgs,
            '--share-net',
            `--box-id=${workerIndex}`,
            '--processes',
            '--chdir=/root',
            '--run',
            ...propagatedEnvVars,
            nodeExecutablePath,
            `/root/main.js`
        ].join(' ')

        log.debug({ command: fullCommand }, '[IsolateSandboxProcess#create] Executing command')
        const isolateProcess = await exec(fullCommand)
        if (isolateProcess.stdout) {
            isolateProcess.stdout.on('data', (data) => {
                process.stdout.write(data)
            })
        }
        if (isolateProcess.stderr) {
            isolateProcess.stderr.on('data', (data) => {
                process.stderr.write(data)
            })
        }
        return isolateProcess
    }
})

function getEnvironmentVariables(env: Record<string, string | undefined>, workerId: string): string[] {
    return Object.entries({
        ...env,
        AP_BASE_CODE_DIRECTORY: `/codes`,
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
    const fExists = !isNil(flowVersionId) && await fileExists(path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId))
    if (fExists) {
        dirsToBind.push(`--dir=${path.join('/codes', flowVersionId)}=${path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId)}`)
    }
    if (customPiecesPath) {
        dirsToBind.push(`--dir=/node_modules=${path.resolve(customPiecesPath, 'node_modules')}:maybe`)
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